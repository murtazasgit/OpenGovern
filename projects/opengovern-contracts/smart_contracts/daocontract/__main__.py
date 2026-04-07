"""
__main__.py -- Quick-deploy a test DaoContract to LocalNet.

Usage:
    cd daodao-contracts
    python -m smart_contracts.daocontract

What it does:
    1. Connects to AlgoKit LocalNet
    2. Gets the first funded account (deployer)
    3. Deploys DaoContract with sample params
    4. Funds the app with 1 ALGO
    5. Prints App ID + App Address
    6. Appends record to deployed_daos.json
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import algokit_utils

from smart_contracts.artifacts.daocontract.daocontract_client import (
    CreateDaoArgs,
    DaocontractFactory,
    DaocontractMethodCallCreateParams,
)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

# ── Deployment record file (project root) ────────────────────────────────────
DEPLOYED_FILE = Path(__file__).resolve().parents[1] / "deployed_daos.json"


def main() -> None:
    """Deploy a test DAO to LocalNet."""

    # ── 1. Connect to LocalNet ────────────────────────────────────────────
    log.info("Connecting to LocalNet...")
    algorand = algokit_utils.AlgorandClient.default_localnet()

    # ── 2. Get funded deployer account ────────────────────────────────────
    deployer = algorand.account.localnet_dispenser()
    log.info("Deployer: %s", deployer.address)

    # ── 3. Deploy with sample params ──────────────────────────────────────
    dao_name = "Test DAO"
    dao_description = "A test DAO"
    quorum = 1
    threshold = 51
    voting_duration = 300  # 5 minutes

    log.info("Deploying '%s'...", dao_name)

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

    app_id = app_client.app_id
    app_address = app_client.app_address

    # ── 4. Fund the app account (for inner txns + MBR) ────────────────────
    if result.operation_performed in (
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ):
        algorand.send.payment(
            algokit_utils.PaymentParams(
                sender=deployer.address,
                receiver=app_address,
                amount=algokit_utils.AlgoAmount(algo=1),
            )
        )
        log.info("Funded app with 1 ALGO")

    # ── 5. Print summary ──────────────────────────────────────────────────
    print()
    print("+===============================================+")
    print("|         DAO Deployed to LocalNet!              |")
    print("+===============================================+")
    print(f"|  App ID      : {app_id:<30}|")
    print(f"|  App Address : {str(app_address)[:28]}... |")
    print(f"|  DAO Name    : {dao_name:<30}|")
    print(f"|  Quorum      : {quorum:<30}|")
    print(f"|  Threshold   : {threshold}%{'':<28}|")
    print(f"|  Vote Window : {voting_duration}s{'':<27}|")
    print("+===============================================+")
    print()

    # ── 6. Append to deployed_daos.json ───────────────────────────────────
    records: list[dict[str, object]] = []
    if DEPLOYED_FILE.exists():
        try:
            records = json.loads(DEPLOYED_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, ValueError):
            records = []

    records.append(
        {
            "appId": app_id,
            "appAddress": str(app_address),
            "name": dao_name,
            "deployedAt": datetime.now(tz=timezone.utc).isoformat(),
        }
    )

    DEPLOYED_FILE.write_text(json.dumps(records, indent=2), encoding="utf-8")
    log.info("Saved -> %s", DEPLOYED_FILE)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        log.error("Deployment failed: %s", exc)
        sys.exit(1)
