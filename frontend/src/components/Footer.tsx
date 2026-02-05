import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">PriVest</h2>
                <p className="text-sm text-gray-400">Confidential RWA Platform</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Revolutionizing Real-World Asset management with confidential computing.
              Built for the iExec Hack4Privacy Hackathon.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/investor" className="text-gray-400 hover:text-white transition-colors">
                  Investor Portal
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="text-gray-400 hover:text-white transition-colors">
                  Transaction History
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.iex.ec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  iExec Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/your-repo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://hackathon.dorahacks.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Hackathon Page
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Built With</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">IE</span>
                </div>
                <span className="text-gray-400">iExec Confidential Computing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">T</span>
                </div>
                <span className="text-gray-400">Trusted Execution Environment</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">SC</span>
                </div>
                <span className="text-gray-400">Smart Contracts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} PriVest RWA. Built for iExec Hack4Privacy Hackathon. 
            All calculations are performed confidentially in TEEs.
          </p>
        </div>
      </div>
    </footer>
  );
}