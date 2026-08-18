import Link from 'next/link';
import { Shield, Search, Bug, DollarSign, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const features = [
  {
    icon: Search,
    title: 'Find Bias',
    description: 'Test AI models for algorithmic bias across gender, race, age, and more.',
  },
  {
    icon: Bug,
    title: 'Report Bugs',
    description: 'Submit detailed bug reports with reproduction steps and evidence.',
  },
  {
    icon: DollarSign,
    title: 'Earn Bounties',
    description: 'Get paid for finding and reporting bias in production AI systems.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="h-12 w-12" />
              <span className="text-2xl font-bold">Bias Bounty</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Make AI Fairer,<br />Get Rewarded
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join the first bug bounty platform dedicated to algorithmic bias.
              Help companies build fairer AI while earning rewards for your expertise.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="white">
                  Start Hunting <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/models">
                <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10">
                  Browse Models
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600">50+</div>
              <div className="text-gray-600 mt-2">AI Models Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">$250K+</div>
              <div className="text-gray-600 mt-2">Bounties Paid</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">500+</div>
              <div className="text-gray-600 mt-2">Bugs Found</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">100+</div>
              <div className="text-gray-600 mt-2">Companies</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make AI Fairer?</h2>
          <p className="text-primary-100 mb-8">
            Whether you're a company wanting to improve your AI or a researcher passionate about fairness,
            there's a place for you here.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register?role=COMPANY">
              <Button size="lg" variant="white">
                List Your AI Model
              </Button>
            </Link>
            <Link href="/register?role=RESEARCHER">
              <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10">
                Start Hunting Bugs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
