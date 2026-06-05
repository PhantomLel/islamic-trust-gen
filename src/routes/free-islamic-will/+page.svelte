<script lang="ts">
	import { consultationBookingUrl, defaultPrepFee, formatUsd } from '$lib/config';

	let emailInput = $state('');
	let emailStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!emailInput || emailStatus === 'loading') return;
		emailStatus = 'loading';
		try {
			const res = await fetch('/api/email-capture', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: emailInput, source: 'free-will-page' })
			});
			emailStatus = res.ok ? 'success' : 'error';
			if (res.ok) emailInput = '';
		} catch {
			emailStatus = 'error';
		}
	}

	const included = [
		'Islamic distribution schedule following Qur\'anic fractions',
		'Community property acknowledgment (Texas and California)',
		'Islamic reconciliation letter',
		'Signing instructions and witness requirements',
		'Valid in all 50 states as a self-help document',
	];
</script>

<svelte:head>
	<title>Free Islamic Will — Muslim Legacy Planning</title>
	<meta name="description" content="Create your free Islamic will. Attorney-informed and shariah-grounded — the starting point for every Muslim family's estate plan." />
</svelte:head>

<!-- NAV (minimal) -->
<nav class="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-navy/10">
	<div class="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
		<a href="/" aria-label="Muslim Legacy Planning — home" class="flex items-center gap-3 transition-opacity hover:opacity-75">
			<img src="/mcdaniel.png" alt="" class="h-8 w-auto" />
			<span class="text-navy font-semibold text-sm tracking-tight" style="font-family: 'Playfair Display', Georgia, serif;">
				Muslim Legacy Planning
			</span>
		</a>
		<a href={consultationBookingUrl} class="px-5 py-2 text-sm font-medium text-cream bg-navy rounded-lg transition-all duration-200 hover:bg-navy-light">
			Book Consultation
		</a>
	</div>
</nav>

<div class="bg-cream min-h-dvh font-sans pt-16">

	<!-- HERO -->
	<section class="pt-20 pb-16 px-6 relative overflow-hidden">
		<div class="absolute inset-0 pointer-events-none"
			style="background: radial-gradient(ellipse 60% 55% at 50% 30%, rgba(74,124,111,0.08) 0%, transparent 65%);">
		</div>

		<div class="max-w-4xl mx-auto relative">
			<div class="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
				<div>
					<div class="flex items-center gap-3 mb-7">
						<span class="w-6 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Free · No credit card required</span>
					</div>
					<h1 class="text-3xl md:text-5xl tracking-tight text-navy leading-tight text-balance mb-5">
						Your Free Islamic Will
					</h1>
					<p class="text-navy/58 text-base leading-relaxed mb-8 max-w-[46ch]">
						Attorney-informed and shariah-grounded. The right first document for every Muslim family — regardless of estate size, state of residence, or how much you already know about estate planning.
					</p>

					<div class="bg-navy/4 rounded-xl border border-navy/8 p-6 mb-8">
						<div class="text-navy/40 text-[10px] tracking-[0.25em] uppercase mb-4">What's included</div>
						<ul class="flex flex-col gap-3">
							{#each included as item}
								<li class="flex items-start gap-2.5 text-sm text-navy/70">
									<svg class="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
									{item}
								</li>
							{/each}
						</ul>
					</div>

					<div class="bg-navy/4 rounded-xl border border-navy/8 p-5">
						<div class="text-navy/40 text-[10px] tracking-[0.25em] uppercase mb-2">Legal note</div>
						<p class="text-navy/50 text-xs leading-relaxed">
							In Texas and California, this document is attorney-supervised by McDaniel Estate Planning, PLLC. In all other states, this is a self-help educational resource and does not create an attorney-client relationship. State law varies — consult a licensed attorney in your state for legal advice.
						</p>
					</div>
				</div>

				<!-- Sign-up Form -->
				<div class="bg-white/70 backdrop-blur rounded-2xl border border-navy/10 p-8 shadow-xl shadow-navy/4">
					{#if emailStatus === 'success'}
						<div class="text-center py-8">
							<div class="w-14 h-14 rounded-full bg-emerald-accent/10 flex items-center justify-center mx-auto mb-5">
								<svg class="w-7 h-7 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							</div>
							<h2 class="text-xl tracking-tight text-navy mb-3">You're on the list.</h2>
							<p class="text-navy/55 text-sm leading-relaxed mb-6">
								The free Islamic will is being built now. We'll notify you the moment it's ready — and send the Islamic estate planning checklist in the meantime.
							</p>
							<a href="/" class="text-emerald-accent text-sm hover:text-emerald-light transition-colors">
								← Back to Muslim Legacy Planning
							</a>
						</div>
					{:else}
						<div class="text-navy/40 text-[10px] tracking-[0.25em] uppercase mb-2">Get early access</div>
						<h2 class="text-2xl tracking-tight text-navy mb-2">Free Islamic Will</h2>
						<p class="text-navy/50 text-sm leading-relaxed mb-7">
							The free will flow is launching soon. Enter your email to be notified first and receive our Islamic estate planning checklist immediately.
						</p>

						<form onsubmit={handleSubmit} class="flex flex-col gap-4">
							<div class="flex flex-col gap-1.5">
								<label for="email" class="text-navy/55 text-xs tracking-wide">Email address</label>
								<input
									id="email"
									type="email"
									bind:value={emailInput}
									placeholder="your@email.com"
									required
									disabled={emailStatus === 'loading'}
									class="px-4 py-3 text-sm text-navy bg-cream border border-navy/15 rounded-lg outline-none
										   focus:border-emerald-accent/60 focus:ring-1 focus:ring-emerald-accent/30 transition-all
										   placeholder:text-navy/25 disabled:opacity-50"
								/>
							</div>

							{#if emailStatus === 'error'}
								<p class="text-xs text-red-600">Something went wrong — please try again.</p>
							{/if}

							<button
								type="submit"
								disabled={emailStatus === 'loading'}
								class="w-full px-6 py-3.5 text-sm font-medium text-cream bg-emerald-accent rounded-lg transition-all duration-200
									   hover:bg-emerald-light hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
							>
								{emailStatus === 'loading' ? 'One moment…' : 'Notify me when it\'s ready'}
							</button>

							<p class="text-navy/30 text-xs text-center">Your information is never shared with anyone.</p>
						</form>

						<div class="mt-8 pt-7 border-t border-navy/8">
							<p class="text-navy/45 text-xs leading-relaxed mb-4">
								Already have a more complex situation? Skip the will and go straight to the right plan.
							</p>
							<div class="flex flex-col gap-2">
								<a href="/trust" class="text-sm text-navy/65 hover:text-emerald-accent transition-colors flex items-center gap-1.5 group">
									<svg class="w-3 h-3 shrink-0 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
									GoodTree Trust — {formatUsd(defaultPrepFee)}
								</a>
								<a href={consultationBookingUrl} class="text-sm text-navy/65 hover:text-emerald-accent transition-colors flex items-center gap-1.5 group">
									<svg class="w-3 h-3 shrink-0 text-emerald-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
									Legacy Plan — from $3,200
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- WHY A WILL MATTERS -->
	<section class="py-20 px-6 bg-white/50">
		<div class="max-w-4xl mx-auto">
			<div class="grid md:grid-cols-[1fr_1.4fr] gap-12 items-start">
				<div>
					<div class="flex items-center gap-3 mb-5">
						<span class="w-6 h-px bg-emerald-accent/60"></span>
						<span class="text-emerald-accent text-[11px] tracking-[0.28em] uppercase font-medium">Why it matters</span>
					</div>
					<h2 class="text-2xl md:text-3xl tracking-tight text-navy text-balance leading-tight mb-5">
						Without a will, U.S. law decides what you meant.
					</h2>
					<p class="text-navy/55 text-sm leading-relaxed mb-4">
						When a Muslim dies without an estate plan, state intestacy law distributes the estate — according to state law, not Qur'anic fractions. Spouses may receive more than shariah prescribes. Children may receive less. Parents may be excluded entirely.
					</p>
					<p class="text-navy/55 text-sm leading-relaxed">
						An Islamic will is the first step toward making sure your intentions are recorded, your heirs are named, and your distribution follows what Allah prescribed.
					</p>
				</div>

				<div class="flex flex-col gap-4">
					{#each [
						{ label: 'A will is a legal declaration', body: 'It tells a court — and your family — exactly what you intended. Without one, the court decides based on state law.' },
						{ label: 'Islamic distribution by default', body: "The free Islamic will includes a Qur'anic distribution schedule so your heirs receive the shares Allah prescribed." },
						{ label: 'The foundation for everything else', body: 'Whether you go on to build a trust, an endowment, or nothing further, a will is where every plan begins.' }
					] as item, i}
						<div class="flex gap-4 items-start p-5 rounded-xl bg-cream border border-navy/8">
							<span class="text-emerald-accent/55 text-[10px] tabular-nums tracking-widest mt-0.5 shrink-0">0{i + 1}</span>
							<div>
								<div class="text-navy text-sm font-medium mb-1">{item.label}</div>
								<p class="text-navy/50 text-sm leading-relaxed">{item.body}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- FOOTER (minimal) -->
	<footer class="px-6 py-10 border-t border-navy/8">
		<div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
			<p class="text-navy/35 text-xs">© 2026 McDaniel Estate Planning, PLLC. Licensed in Texas and California.</p>
			<div class="flex gap-6">
				<a href="/" class="text-navy/45 text-xs hover:text-navy/70 transition-colors">Home</a>
				<a href="/trust" class="text-navy/45 text-xs hover:text-navy/70 transition-colors">GoodTree Trust</a>
				<a href={consultationBookingUrl} class="text-navy/45 text-xs hover:text-navy/70 transition-colors">Book Consultation</a>
			</div>
		</div>
	</footer>
</div>
