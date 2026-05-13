<script lang="ts" module>
	export type ModalProps = {
		onClose?: () => void;
		closeOnBackdrop?: boolean;
		closeOnEscape?: boolean;
		labelledby?: string;
		describedby?: string;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { onDestroy, onMount, type Snippet } from "svelte";
	import { portal } from "./actions/portal";

	const {
		onClose,
		closeOnBackdrop = $bindable(true),
		closeOnEscape = $bindable(true),
		labelledby,
		describedby,
		children,
	}: ModalProps = $props();

	let modalEl: HTMLElement | null = null;
	let previousActive: HTMLElement | null = null;
	let backgroundEl: HTMLElement | null = null;
	let previousAriaHidden: string | null = null;

	function close() {
		onClose?.();
	}

	function onBackdropClick(e: MouseEvent) {
		if (!closeOnBackdrop) return;
		if (e.target === e.currentTarget) close();
	}

	function onKeydown(e: KeyboardEvent) {
		if (closeOnEscape && e.key === "Escape") {
			e.preventDefault();
			close();
		}
	}

	onMount(() => {
		previousActive = document.activeElement as HTMLElement | null;
		document.body.style.overflow = "hidden";

		// Hide background from assistive tech
		backgroundEl = document.querySelector("main") as HTMLElement | null;
		if (backgroundEl) {
			previousAriaHidden = backgroundEl.getAttribute("aria-hidden");
			if (!backgroundEl.hasAttribute("aria-hidden")) {
				backgroundEl.setAttribute("aria-hidden", "true");
			}
		}

		if (modalEl) {
			const focusable = modalEl.querySelector<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			focusable?.focus();
		}
	});

	onDestroy(() => {
		document.body.style.overflow = "";
		previousActive?.focus();

		if (backgroundEl) {
			if (previousAriaHidden === null) {
				backgroundEl.removeAttribute("aria-hidden");
			} else if (previousAriaHidden !== null) {
				backgroundEl.setAttribute("aria-hidden", previousAriaHidden);
			}
		}
	});
</script>

<svelte:document onkeydown={onKeydown} />

<div
	use:portal
	class="fixed inset-0 z-50 grid min-h-screen touch-pan-y place-items-center py-8"
>
	<div
		class="absolute inset-0 touch-pan-y bg-black/50"
		onclick={onBackdropClick}
		aria-hidden="true"
	></div>
	<div
		bind:this={modalEl}
		class="pointer-events-auto relative z-10 mx-4 max-h-[calc(100vh-4rem)] w-full max-w-2xl touch-auto overflow-y-auto rounded bg-white p-6 shadow-lg [-webkit-overflow-scrolling:touch]"
		role="dialog"
		aria-modal="true"
		aria-labelledby={labelledby}
		aria-describedby={describedby}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
