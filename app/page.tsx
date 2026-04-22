export default function Home() {
  return (
    <div className="space-y-16">
      <section className="py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
            <span className="text-4xl font-bold text-blue-600">E</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
            Supercharge Your Workflow
          </h1>
          <p className="text-xl text-blue-600 mb-8">
            All-in-one productivity platform that helps you get more done, faster.
            No more switching between apps.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { number: '10K+', label: 'Active Users' },
            { number: '50+', label: 'Tools' },
            { number: '99.9%', label: 'Uptime' },
            { number: '24/7', label: 'Support' },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-700">{stat.number}</p>
              <p className="text-sm text-blue-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-blue-50 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue-800">How It Works</h2>
          <p className="text-blue-600 mt-2">Get started in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: '01',
              title: 'Create Account',
              desc: 'Sign up in seconds with just your email. No credit card required.',
              icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a4 4 0 00-4 4H4a4 4 0 00-4 4v2a4 4 0 004 4h4a4 4 0 004-4V4a4 4 0 00-4-4'
            },
            {
              step: '02',
              title: 'Choose Tools',
              desc: 'Browse our library of 50+ tools and select what you need.',
              icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
            },
            {
              step: '03',
              title: 'Get Results',
              desc: 'Watch your productivity soar with our powerful tools.',
              icon: 'M13 10V3L4 14h7v7l9-11h-7z'
            },
          ].map((item, i) => (
            <div key={i} className="relative p-8 bg-white rounded-2xl text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">{item.title}</h3>
              <p className="text-blue-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 text-center">
        <p className="text-blue-500">Made with love in Nigeria 🇳🇬</p>
      </section>
    </div>
  );
}
