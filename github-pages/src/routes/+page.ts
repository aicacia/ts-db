import type { PageLoad } from './$types';
import { populateSampleRecipes } from '$lib/sampleRecipes';

export const load: PageLoad = async () => {
	populateSampleRecipes();
};
