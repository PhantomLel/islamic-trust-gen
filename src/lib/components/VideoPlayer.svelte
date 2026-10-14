<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import 'video.js/dist/video-js.css';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type Player = any;

	let {
		src,
		title = '',
		autoplay = false,
		onended = undefined,
		onerror = undefined,
	}: {
		src: string;
		title?: string;
		autoplay?: boolean;
		onended?: () => void;
		onerror?: () => void;
	} = $props();

	let videoEl: HTMLVideoElement;
	let player: Player | null = null;
	let mounted = false;
	/** width / height — used on md+ to cap width so portrait video fits within the viewport height budget without clipping */
	let videoAspect = $state(9 / 16);

	$effect(() => {
		src;
		videoAspect = 9 / 16;
	});

	onMount(async () => {
		mounted = true;
		const vjs = (await import('video.js')).default;

		player = vjs(videoEl, {
			controls: true,
			autoplay: autoplay,
			preload: 'metadata',
			fluid: true,
			playbackRates: [0.75, 1, 1.25, 1.5, 2],
			controlBar: {
				children: [
					'playToggle',
					'volumePanel',
					'currentTimeDisplay',
					'timeDivider',
					'durationDisplay',
					'progressControl',
					'playbackRateMenuButton',
					'fullscreenToggle',
				],
			},
		});

		player.src({ src: src, type: 'video/mp4' });

		if (onended) {
			player.on('ended', onended);
		}

		if (onerror) {
			player.on('error', onerror);
		}

		const syncAspectFromVideo = () => {
			if (!player) return;
			const w = player.videoWidth();
			const h = player.videoHeight();
			if (w > 0 && h > 0) {
				videoAspect = w / h;
			}
		};

		player.on('loadedmetadata', syncAspectFromVideo);

		player.ready(() => {
			if (!player) return;
			const el = player.el() as HTMLElement;
			el.style.setProperty('--vjs-theme-color', '#4a7c6f');
			syncAspectFromVideo();
		});
	});

	onDestroy(() => {
		if (player) {
			player.dispose();
			player = null;
		}
	});

	$effect(() => {
		if (player && mounted && src) {
			player.src({ src: src, type: 'video/mp4' });
		}
	});
</script>

<div class="video-player-wrapper w-full">
	{#if title}
		<p class="text-sm font-medium text-navy/70 leading-tight mb-3">{title}</p>
	{/if}

	<div
		class="relative w-full max-w-full rounded-xl overflow-hidden shadow-md border border-navy/[0.08] md:mx-auto md:max-w-[min(100%,calc(72vh*var(--video-aspect)))]"
		style="--video-aspect: {videoAspect}"
	>
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoEl}
			class="video-js vjs-big-play-centered"
			playsinline
		>
			<source src={src} type="video/mp4" />
			<p class="vjs-no-js text-sm text-navy/65 p-4">
				To view this video please enable JavaScript, and consider upgrading to a web browser that
				supports HTML5 video.
			</p>
		</video>
	</div>
</div>

<style>
	/* Big play button */
	.video-player-wrapper :global(.video-js .vjs-big-play-button) {
		background-color: rgba(74, 124, 111, 0.85);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		width: 64px;
		height: 64px;
		line-height: 64px;
		margin-left: -32px;
		margin-top: -32px;
		backdrop-filter: blur(4px);
		transition: background-color 0.2s ease, transform 0.15s ease;
	}

	.video-player-wrapper :global(.video-js:hover .vjs-big-play-button),
	.video-player-wrapper :global(.video-js .vjs-big-play-button:hover) {
		background-color: rgba(74, 124, 111, 1);
		transform: scale(1.05);
	}

	.video-player-wrapper :global(.video-js .vjs-big-play-button .vjs-icon-placeholder::before) {
		font-size: 28px;
		line-height: 64px;
	}

	/* Control bar */
	.video-player-wrapper :global(.video-js .vjs-control-bar) {
		background: linear-gradient(to top, rgba(30, 42, 58, 0.92) 0%, rgba(30, 42, 58, 0.6) 100%);
		backdrop-filter: blur(4px);
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
		padding: 0 4px;
	}

	/* Progress bar */
	.video-player-wrapper :global(.video-js .vjs-play-progress) {
		background-color: #4a7c6f;
	}

	.video-player-wrapper :global(.video-js .vjs-play-progress::before) {
		color: #4a7c6f;
	}

	.video-player-wrapper :global(.video-js .vjs-progress-control:hover .vjs-play-progress) {
		background-color: #5a9c8a;
	}

	/* Load progress */
	.video-player-wrapper :global(.video-js .vjs-load-progress) {
		background-color: rgba(74, 124, 111, 0.2);
	}

	/* Volume fill */
	.video-player-wrapper :global(.video-js .vjs-volume-level) {
		background-color: #4a7c6f;
	}

	.video-player-wrapper :global(.video-js .vjs-volume-level::before) {
		color: #4a7c6f;
	}

	/* Selected menu item */
	.video-player-wrapper :global(.video-js .vjs-menu-item.vjs-selected) {
		background-color: #4a7c6f;
		color: #fff;
	}

	.video-player-wrapper :global(.video-js .vjs-menu-item:hover) {
		background-color: rgba(74, 124, 111, 0.15);
		color: #1e2a3a;
	}

	/* Tooltip */
	.video-player-wrapper :global(.vjs-time-tooltip),
	.video-player-wrapper :global(.vjs-mouse-display .vjs-time-tooltip) {
		background-color: #1e2a3a;
		color: #faf6f0;
		border-radius: 6px;
		font-size: 11px;
	}
</style>
