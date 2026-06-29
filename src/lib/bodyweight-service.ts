import { supabase } from './supabase';
import type { BodyweightEntry, CreateBodyweightEntryInput, UpdateBodyweightEntryInput } from '@/types/bodyweight';
import type { DbBodyweightEntry } from '@/types/database';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function toEntry(raw: DbBodyweightEntry): BodyweightEntry {
  return {
    id: raw.id,
    userId: raw.user_id,
    weightKg: raw.weight_kg,
    unit: raw.unit,
    measuredAt: raw.measured_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function getCurrentWeight(userId: string): Promise<BodyweightEntry | null> {
  const { data, error } = await supabase
    .from('bodyweight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toEntry(data) : null;
}

export async function getWeightHistory(userId: string): Promise<BodyweightEntry[]> {
  const { data, error } = await supabase
    .from('bodyweight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toEntry);
}

export async function createWeightEntry(
  userId: string,
  input: CreateBodyweightEntryInput
): Promise<BodyweightEntry> {
  const measuredAt = new Date(input.measuredAt + 'T12:00:00Z').toISOString();
  const { data, error } = await supabase
    .from('bodyweight_entries')
    .insert({
      id: generateId(),
      user_id: userId,
      weight_kg: input.weightKg,
      unit: input.unit,
      date: input.measuredAt,
      measured_at: measuredAt,
      source: 'manual',
      sync_status: 'synced',
    })
    .select()
    .single();
  if (error) throw error;
  return toEntry(data);
}

export async function updateWeightEntry(
  entryId: string,
  input: UpdateBodyweightEntryInput
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.weightKg !== undefined) patch.weight_kg = input.weightKg;
  if (input.unit !== undefined) patch.unit = input.unit;
  if (input.measuredAt !== undefined) {
    patch.date = input.measuredAt;
    patch.measured_at = new Date(input.measuredAt + 'T12:00:00Z').toISOString();
  }
  const { error } = await supabase
    .from('bodyweight_entries')
    .update(patch)
    .eq('id', entryId);
  if (error) throw error;
}

export async function deleteWeightEntry(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('bodyweight_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw error;
}
