import React from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppWalletProvider } from './utils/WalletContext'
import { ConnectWallet } from './components/ConnectWallet'
import Home from './Home'
import DAOPage from './pages/DAOPage'
import ExplorePage from './pages/ExplorePage'
import EditorialPage from './pages/EditorialPage'
import AboutPage from './pages/AboutPage'

const NavLink = ({ to, text }: { to: string; text: string }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link to={to} className="relative group block mb-6">
      <div
        className={`panel-web3 p-4 uppercase font-bold text-sm tracking-widest text-center transition-all duration-300 active:scale-95 ${isActive ? 'bg-[#22c55e] lg:translate-x-4 shadow-none translate-x-1 translate-y-1 text-white border-white' : 'hover:translate-x-2 hover:bg-[#22c55e]/10'}`}
      >
        {text}
      </div>
      {/* Decorative node connector line for desktop */}
      <div className="absolute top-1/2 -right-12 w-12 h-1 bg-black -z-10 hidden lg:block opacity-50"></div>
      <div className="absolute top-1/2 -right-12 w-3 h-3 rounded-full bg-black -mt-1 hidden lg:block shadow-[2px_2px_0_#000]"></div>
    </Link>
  )
}

function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen text-black flex flex-col lg:flex-row relative z-10 p-4 lg:p-8 xl:p-12 overflow-x-hidden gap-8">
      <Toaster position="bottom-right" toastOptions={{ className: 'border-2 border-black font-mono shadow-[4px_4px_0_#000]' }} />

      {/* ── Mobile Header ──────────────────────────────────────────── */}
      <header className="lg:hidden flex justify-between items-center mb-4 z-30">
        <div className="panel-web3 p-4 bg-white flex flex-col items-center justify-center transform -rotate-1">
          <h1 className="text-xl font-extrabold tracking-tighter uppercase leading-none">OPEN</h1>
          <h1 className="text-xl font-extrabold tracking-tighter uppercase leading-none text-[#7c3aed]">GOVERN</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="panel-web3 p-4 bg-white font-bold uppercase tracking-widest text-sm"
        >
          {isMobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {/* ── Side Navigation ──────────────────────────────────────────── */}
      <nav
        className={`${
          isMobileMenuOpen ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-[280px] flex-shrink-0 flex-col z-20 sticky lg:top-4 lg:h-[calc(100vh-64px)] bg-[#c8c8f0] lg:bg-transparent p-4 lg:p-0 border-4 border-black lg:border-0 mb-8 lg:mb-0`}
      >
        {/* Main Logo Block - Desktop Only */}
        <div className="hidden lg:flex panel-web3 p-8 bg-white flex flex-col items-center justify-center mb-12 transform -rotate-1">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tighter text-center uppercase leading-none mb-2">OPEN</h1>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tighter text-center uppercase leading-none text-[#7c3aed]">GOVERN</h1>
        </div>

        {/* Navigation pills */}
        <div className="flex-1 flex flex-col justify-start lg:pr-12 relative lg:border-r-[4px] lg:border-black gap-2">
          <NavLink to="/" text="Governance" />
          <NavLink to="/explore" text="Explore" />
          <NavLink to="/editorial" text="Editorial" />
          <NavLink to="/about" text="About" />
        </div>
      </nav>

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto z-10 flex flex-col">
        {/* Top Bar inside main content for Wallet */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <div className="hidden md:block text-2xl font-black uppercase tracking-widest bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0_#000] transform -rotate-1">
            Dashboard
          </div>
          <div className="w-full sm:w-auto">
            <ConnectWallet />
          </div>
        </header>

        <div className="w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dao/:appId" element={<DAOPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/editorial" element={<EditorialPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppWalletProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppWalletProvider>
  )
}
