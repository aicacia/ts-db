<script lang="ts">
	import type { Recipe } from './collections/recipes.js';

	const props = $props<{
		initial?: Partial<Recipe> | null;
		onSave?: (payload: Partial<Recipe>) => void;
		onCancel?: () => void;
	}>();

	type IngredientLocal = {
		_id: string;
		item: { name: string; description?: string };
		quantity: { value: number; unit: string };
	};

	type InstructionLocal = { _id: string; text: string };

	function genId() {
		return Math.random().toString(36).substring(2, 9);
	}

	let title = $state('');
	let description = $state('');

	let ingredients = $state<IngredientLocal[]>([]);

	let instructions = $state<InstructionLocal[]>([]);

	$effect(() => {
		const value = props.initial;
		title = value?.title ?? '';
		description = value?.description ?? '';
		ingredients = value?.ingredients
			? value.ingredients.map((ing: IngredientLocal) => ({
					_id: genId(),
					item: { ...ing.item },
					quantity: { ...ing.quantity }
				}))
			: [];
		instructions = value?.instructions
			? value.instructions.map((ins: string) => ({ _id: genId(), text: ins }))
			: [];
	});

	// Derived cleaned outputs (use $derived for computed values)
	const cleanedIngredients = $derived(
		ingredients.map((ing) => {
			const { _id, ...rest } = ing;
			void _id;
			return rest;
		})
	);

	const cleanedInstructions = $derived(instructions.map((ins) => ins.text));

	function addIngredient() {
		ingredients = [
			...ingredients,
			{ _id: genId(), item: { name: '', description: '' }, quantity: { value: 0, unit: 'g' } }
		];
	}

	function removeIngredient(id: string) {
		ingredients = ingredients.filter((ing) => ing._id !== id);
	}

	function addInstruction() {
		instructions = [...instructions, { _id: genId(), text: '' }];
	}

	function removeInstruction(id: string) {
		instructions = instructions.filter((ins) => ins._id !== id);
	}

	function save(e?: SubmitEvent) {
		e?.preventDefault();

		if (typeof props.onSave === 'function') {
			props.onSave({
				title,
				description,
				ingredients: cleanedIngredients,
				instructions: cleanedInstructions
			});
		}
	}

	function cancel() {
		if (typeof props.onCancel === 'function') props.onCancel();
	}
</script>

<form onsubmit={save}>
	<div>
		<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
		<input
			id="title"
			class="w-full rounded border px-3 py-2"
			bind:value={title}
			placeholder="Recipe title"
		/>
	</div>

	<div>
		<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
		<textarea
			id="description"
			class="w-full rounded border px-3 py-2"
			rows={3}
			bind:value={description}
			placeholder="Short description"
		></textarea>
	</div>

	<div>
		<h3>Ingredients</h3>
		{#each ingredients as ingredient (ingredient._id)}
			<div class="flex items-center gap-2">
				<input
					class="min-w-0 flex-1 rounded border px-2 py-1"
					placeholder="Name"
					bind:value={ingredient.item.name}
				/>
				<input
					class="min-w-0 flex-1 rounded border px-2 py-1"
					placeholder="Desc"
					bind:value={ingredient.item.description}
				/>
				<input
					class="w-20 rounded border px-2 py-1"
					type="number"
					min="0"
					step="any"
					value={ingredient.quantity.value}
					oninput={(e) =>
						(ingredient.quantity.value = parseFloat((e.target as HTMLInputElement).value || '0'))}
				/>
				<select class="rounded border px-2 py-1" bind:value={ingredient.quantity.unit}>
					<option value="g">g</option>
					<option value="kg">kg</option>
					<option value="ml">ml</option>
					<option value="l">l</option>
				</select>
				<button
					type="button"
					onclick={() => removeIngredient(ingredient._id)}
					class="rounded bg-red-100 px-2 py-1 text-red-700">Remove</button
				>
			</div>
		{/each}
		<div>
			<button
				type="button"
				onclick={addIngredient}
				class="rounded bg-green-600 px-3 py-1 text-white">Add Ingredient</button
			>
		</div>
	</div>

	<div>
		<h3>Instructions</h3>
		{#each instructions as instruction (instruction._id)}
			<div class="flex items-center gap-2">
				<textarea
					class="min-w-0 flex-1 rounded border px-2 py-1"
					rows={2}
					bind:value={instruction.text}
				></textarea>
				<button
					type="button"
					onclick={() => removeInstruction(instruction._id)}
					class="rounded bg-red-100 px-2 py-1 text-red-700">Remove</button
				>
			</div>
		{/each}
		<div>
			<button
				type="button"
				onclick={addInstruction}
				class="rounded bg-green-600 px-3 py-1 text-white">Add Instruction</button
			>
		</div>
	</div>

	<div class="flex gap-2">
		<button type="submit" class="rounded bg-blue-600 px-3 py-2 text-white">Save</button>
		<button type="button" onclick={cancel} class="rounded bg-gray-200 px-3 py-2">Cancel</button>
	</div>
</form>
