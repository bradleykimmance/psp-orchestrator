const App = () => (
  <main className="mx-auto max-w-2xl px-4 py-12">
    <header className="mb-8">
      <p className="mb-2 font-mono text-xs font-medium tracking-[0.25em] text-gold-500 uppercase">
        &#47;&#47; one request, two PSPs
      </p>
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          PSP Orchestrator
        </h1>
        <span className="mt-1 inline-block rotate-[-4deg] rounded-md border-2 border-gold-500/50 px-2 py-0.5 font-mono text-[0.65rem] font-bold tracking-[0.2em] text-gold-500/80 uppercase select-none">
          Sandbox
        </span>
      </div>
    </header>

    <footer className="mt-10 text-center text-xs text-warm-gray-500">
      Stripe test mode + Adyen checkout-test · part of{' '}
      <a
        className="underline hover:text-gold-500"
        href="https://bradleykimmance.dev"
      >
        bradleykimmance.dev
      </a>
    </footer>
  </main>
);

export default App;
