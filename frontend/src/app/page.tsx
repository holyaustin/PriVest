"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ArrowRight, Shield, Lock, BarChart, Zap } from "lucide-react";

export default function LandingPage() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  const login = () => open({ view: "Connect" });

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Confidential Computing",
      description: "Profit calculations run inside iExec TEEs. Your formulas and sensitive data remain encrypted.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Privacy-Preserving",
      description: "Only final payout amounts are revealed on-chain. Investor stakes and profit data stay private.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description: "Monitor RWA performance and investor allocations with comprehensive dashboards.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Automated Payouts",
      description: "Smart contracts automatically distribute dividends once confidential calculations complete.",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const stats = [
    { value: "100%", label: "Confidential" },
    { value: "0%", label: "Data Exposure" },
    { value: "<30s", label: "TEE Calculation" },
    { value: "∞", label: "Scalability" }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-sky-500 via-yellow-200 to-purple-50" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-8">
              <span className="text-sm font-medium text-blue-700">
                🏆 Built for iExec Hack4Privacy Hackathon
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Confidential RWA Management
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              PriVest leverages iExec Trusted Execution Environments to provide 
              <span className="font-semibold text-blue-600"> completely private profit calculations </span>
              for Real-World Assets. Your sensitive data never leaves the secure enclave.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!isConnected ? (
                <button
                  onClick={login}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Launch App
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link
                  href="/admin"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Go to Admin Portal
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <Link
                href="/investor"
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                Investor Portal
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How PriVest Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A seamless integration of iExec TEEs and smart contracts for privacy-preserving RWA management
            </p>
          </div>

          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 transform -translate-y-1/2" />
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Input Sensitive Data", desc: "Admin inputs confidential profit data and investor stakes" },
                { step: "2", title: "TEE Calculation", desc: "iExec runs your formula in a secure Trusted Execution Environment" },
                { step: "3", title: "Verifiable Output", desc: "Only calculated payout amounts are revealed, not the inputs" },
                { step: "4", title: "Automated Distribution", desc: "Smart contracts handle dividend claims automatically" }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform RWA Management?
          </h2>
          <p className="text-blue-100 text-xl mb-10">
            Experience the power of confidential computing with iExec TEEs.
            Your data deserves absolute privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={isConnected ? undefined : login}
              className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isConnected ? "Dashboard Accessible" : "Get Started Now"}
              {!isConnected && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <Link
              href="/admin"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white/10 transition-all"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}