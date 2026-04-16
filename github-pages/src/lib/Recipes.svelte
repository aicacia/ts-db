<script lang="ts">
	import { recipesCollection } from './collections/recipes.js';
	import { commentsCollection } from './collections/comments.js';
	import { collection } from '@aicacia/db/svelte';
	import RecipeForm from './RecipeForm.svelte';
	import Modal from './Modal.svelte';
	import type { Recipe } from './collections/recipes.js';

	let search = $state('');
	const recipesWithComments = $derived(
		collection(
			(search
				? recipesCollection
						.query()
						.containsIgnoreCase('title', search.trim())
						.orderBy('updatedAt', 'desc')
				: recipesCollection.query().orderBy('updatedAt', 'desc')
			).join(commentsCollection, 'id', 'recipeId')
		)
	);
	let showForm = $state(false);
	let editing: Recipe | null = $state(null);

	function openNew() {
		editing = null;
		showForm = true;
	}

	function openEdit(recipe: Recipe) {
		editing = recipe;
		showForm = true;
	}

	async function handleSave(payload: Partial<Recipe>) {
		if (editing && editing.id) {
			await recipesCollection.update(editing.id, {
				...payload,
				updatedAt: new Date()
			});
		} else {
			const recipe: Recipe = {
				id: Math.random().toString(36).substring(2),
				title: payload.title || '',
				description: payload.description || '',
				ingredients: payload.ingredients || [],
				instructions: payload.instructions || [],
				createdAt: new Date(),
				updatedAt: new Date()
			};
			await recipesCollection.create(recipe);
		}
		showForm = false;
		editing = null;
	}

	function handleCancel() {
		showForm = false;
		editing = null;
	}

	async function handleDelete(id: string) {
		if (confirm('Delete this recipe?')) {
			await recipesCollection.delete(id);
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-gray-50 text-gray-900">
	<div class="mx-auto max-w-4xl p-6">
		<h1 class="mb-4 text-3xl font-bold">Recipes</h1>

		<div class="flex items-center gap-2">
			<input
				class="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-80"
				bind:value={search}
				placeholder="Search recipes..."
			/>
			<button
				onclick={openNew}
				class="ml-2 rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">New Recipe</button
			>
		</div>
	</div>

	{#if showForm}
		<Modal onClose={handleCancel}>
			<div class="mx-auto max-w-4xl p-6">
				<h2 id="recipe-modal-title" class="sr-only">Recipe form</h2>
				<RecipeForm initial={editing} onSave={handleSave} onCancel={handleCancel} />
			</div>
		</Modal>
	{/if}

	<div class="flex grow flex-col overflow-auto">
		<div class="mx-auto max-w-4xl p-4 pb-32">
			<ul class="overflow-auto">
				{#each recipesWithComments.data as recipe (recipe.id)}
					<li class="mb-4 rounded bg-white p-4 shadow">
						<div class="flex items-start justify-between">
							<div>
								<strong class="text-xl font-semibold">{recipe.title}</strong>
								<p class="text-sm text-gray-600">{recipe.description}</p>
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => openEdit(recipe)}
									class="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200">Edit</button
								>
								<button
									onclick={() => handleDelete(recipe.id)}
									class="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200"
									>Delete</button
								>
							</div>
						</div>

						<hr class="my-3 border-gray-100" />
						<ul class="mb-2">
							{#each recipe.ingredients as ingredient, index (index)}
								<li class="text-sm">
									{ingredient.quantity.value}{ingredient.quantity.unit} — {ingredient.item.name}
								</li>
							{/each}
						</ul>
						<ol class="mb-2 list-inside list-decimal">
							{#each recipe.instructions as instruction, index (index)}
								<li class="text-sm">{instruction}</li>
							{/each}
						</ol>
						<hr class="mt-3 border-gray-100" />
						<div class="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
							<h3 class="mb-2 text-sm font-semibold text-gray-700">Comments</h3>
							{#if recipe.comments?.length}
								<ul class="space-y-2">
									{#each recipe.comments as comment (comment.id)}
										<li class="rounded bg-white p-3 shadow-sm">
											<p class="text-sm font-semibold text-gray-900">{comment.author}</p>
											<p class="text-sm text-gray-600">{comment.text}</p>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-sm text-gray-500">No comments yet.</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
