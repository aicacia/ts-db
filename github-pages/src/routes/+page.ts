import {
	populateSampleComments,
	populateSampleRecipes,
} from "$lib/sampleRecipes";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
	await Promise.all([populateSampleRecipes(), populateSampleComments()]);
};
