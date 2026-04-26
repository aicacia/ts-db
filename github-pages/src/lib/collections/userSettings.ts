import * as v from 'valibot';
import { createSingleton, MemorySingletonAdapter } from '@aicacia/db';

export const userSettingsSchema = v.object({
	theme: v.pipe(v.string(), v.picklist(['light', 'dark'])),
	unit: v.pipe(v.string(), v.picklist(['metric', 'imperial']))
});

export type UserSettings = v.InferOutput<typeof userSettingsSchema>;

export const userSettingsSingleton = createSingleton({
	sourceType: MemorySingletonAdapter,
	sourceOptions: { initialValue: { theme: 'light', unit: 'metric' } },
	defaultValue: { theme: 'light', unit: 'metric' }
});
