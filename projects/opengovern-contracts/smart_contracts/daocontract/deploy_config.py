"""
deploy_config.py -- Deploy the Daocontract to localnet or testnet.

Uses the AlgoKit 3.0 typed client generated from the ARC-56 spec.
Appends every deployment record to deployed_daos.json so you never lose
track of previously deployed instances.

Environment variables:
  DEPLOY_NETWORK  -- "localnet" (default) or "testnet"
  DEPLOYER        -- AlgoKit account name (resolved via .env / KMD)
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

import algokit_utils

from smart_contracts.artifacts.daocontract.daocontract_client import (
    CreateDaoArgs,
    DaocontractFactory,
    DaocontractMethodCallCreateParams,
)

logger = logging.getLogger(__name__)

# ── Deployment record file (next to this script) ─────────────────────
DEPLOYED_DAOS_FILE = Path(__file__).parent / "deployed_daos.json"


def _get_algorand_client() -> algokit_utils.AlgorandClient:
    """Return an AlgorandClient for the target network."""
    network = os.getenv("DEPLOY_NETWORK", "localnet").lower()

    if network == "testnet":
        logger.info("Connecting to TestNet...")
        return algokit_utils.AlgorandClient.testnet()

    logger.info("Connecting to LocalNet...")
    return algokit_utils.AlgorandClient.default_localnet()


def _save_deployment_record(
    *,
    network: str,
    app_id: int,
    app_address: str,
    dao_name: str,
    deployer: str,
) -> None:
    """Append a deployment record to deployed_daos.json (create if absent)."""
    records: list[dict[str, object]] = []
    if DEPLOYED_DAOS_FILE.exists():
        try:
            records = json.loads(DEPLOYED_DAOS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, ValueError):
            records = []

    records.append(
        {
            "network": network,
            "app_id": app_id,
            "app_address": app_address,
            "dao_name": dao_name,
            "deployer": deployer,
            "deployed_at": datetime.now(tz=timezone.utc).isoformat(),
        }
    )

    DEPLOYED_DAOS_FILE.write_text(
        json.dumps(records, indent=2), encoding="utf-8"
    )
    logger.info("Saved deployment record -> %s", DEPLOYED_DAOS_FILE)


def deploy() -> None:
    """Build, deploy, and record the DaoContract."""

    # ── 1. Algorand client + deployer account ─────────────────────────
    algorand = _get_algorand_client()
    deployer = algorand.account.from_environment("DEPLOYER")
    network = os.getenv("DEPLOY_NETWORK", "localnet").lower()

    # ── 2. Default DAO params (override via env if you like) ──────────
    dao_name = os.getenv("DAO_NAME", "MyDAO")
    dao_description = os.getenv("DAO_DESCRIPTION", "A community-governed DAO on Algorand")
    quorum = int(os.getenv("DAO_QUORUM", "3"))
    threshold = int(os.getenv("DAO_THRESHOLD", "51"))
    voting_duration = int(os.getenv("DAO_VOTING_DURATION", "86400"))  # 1 day

    # ── 3. Factory + idempotent deploy ────────────────────────────────
    factory = DaocontractFactory(
        algorand,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        create_params=DaocontractMethodCallCreateParams(
            args=CreateDaoArgs(
                name=dao_name,
                description=dao_description,
                quorum=quorum,
                threshold=threshold,
                voting_duration=voting_duration,
            ),
        ),
    )

    # ── 4. Fund the app account so it can send inner txns ─────────────
    if result.operation_performed in (
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ):
        algorand.send.payment(
            algokit_utils.PaymentParams(
                sender=deployer.address,
                receiver=app_client.app_address,
                amount=algokit_utils.AlgoAmount(algo=1),
            )
        )
        logger.info("Funded app account with 1 ALGO")

    # ── 5. Print summary ──────────────────────────────────────────────
    logger.info(
        "\n"
        "+==========================================+\n"
        "|      DAO Contract Deployed!              |\n"
        "+==========================================+\n"
        "|  Network    : %-26s |\n"
        "|  App ID     : %-26s |\n"
        "|  App Address: %.26s...  |\n"
        "|  DAO Name   : %-26s |\n"
        "+==========================================+",
        network,
        app_client.app_id,
        app_client.app_address,
        dao_name,
    )

    # ── 6. Persist to deployed_daos.json ──────────────────────────────
    _save_deployment_record(
        network=network,
        app_id=app_client.app_id,
        app_address=app_client.app_address,
        dao_name=dao_name,
        deployer=deployer.address,
    )
