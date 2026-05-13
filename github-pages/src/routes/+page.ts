import type { PageLoad } from './$types';
import { populateSampleRecipes, populateSampleComments } from '$lib/sampleRecipes';

export const load: PageLoad = async () => {
	await Promise.all([populateSampleRecipes(), populateSampleComments()]);
};
