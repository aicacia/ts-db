<script lang="ts">
	import "../app.css";
	import { singleton } from "@aicacia/orm/svelte";
	import { onDestroy, onMount } from "svelte";
	import faviconSvg from "$lib/assets/favicon.svg";
	import { userSettingsSingleton } from "$lib/collections/userSettings.js";

	const { children } = $props();

	const userSettings = singleton(userSettingsSingleton);

	$effect(() => {
		document.body.dataset.theme = userSettings.data?.theme ?? "light";
	});

	function setSvH() {
		if (typeof window !== "undefined") {
			document.documentElement.style.setProperty(
				"--svh",
				`${window.innerHeight * 0.01}px`,
			);
		}
	}

	onMount(() => {
		setSvH();
		window.addEventListener("resize", setSvH);
		window.addEventListener("orientationchange", setSvH);
	});

	onDestroy(() => {
		window.removeEventListener("resize", setSvH);
		window.removeEventListener("orientationchange", setSvH);
	});
</script>

<svelte:head>
	<link rel="icon" href={faviconSvg} />
</svelte:head>

<main class="flex h-svh max-w-svw flex-col overflow-hidden">
	{@render children()}
</main>
