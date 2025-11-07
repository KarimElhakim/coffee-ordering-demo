import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🌱 Seeding database...');

  // Create store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .upsert({ id: '1', name: 'Demo Coffee Shop' }, { onConflict: 'id' })
    .select()
    .single();

  if (storeError) throw storeError;
  console.log('✅ Store created:', store.name);

  // Create tables
  const tables = Array.from({ length: 10 }, (_, i) => ({
    store_id: store.id,
    label: `Table ${i + 1}`,
  }));

  const { error: tablesError } = await supabase
    .from('tables')
    .upsert(tables, { onConflict: 'id' });

  if (tablesError) throw tablesError;
  console.log('✅ Tables created');

  // Create stations
  const stations = [
    { store_id: store.id, name: 'Bar' },
    { store_id: store.id, name: 'Hot' },
    { store_id: store.id, name: 'Cold' },
  ];

  const { data: stationsData, error: stationsError } = await supabase
    .from('stations')
    .upsert(stations, { onConflict: 'id' })
    .select();

  if (stationsError) throw stationsError;
  console.log('✅ Stations created');

  const barStation = stationsData.find((s) => s.name === 'Bar')!;
  const hotStation = stationsData.find((s) => s.name === 'Hot')!;
  const coldStation = stationsData.find((s) => s.name === 'Cold')!;

  // Create menu items
  const menuItems = [
    {
      store_id: store.id,
      name: 'Espresso',
      base_price: 25,
      station_id: barStation.id,
      is_active: true,
    },
    {
      store_id: store.id,
      name: 'Cappuccino',
      base_price: 35,
      station_id: barStation.id,
      is_active: true,
    },
    {
      store_id: store.id,
      name: 'Iced Latte',
      base_price: 40,
      station_id: coldStation.id,
      is_active: true,
    },
    {
      store_id: store.id,
      name: 'Hot Chocolate',
      base_price: 30,
      station_id: hotStation.id,
      is_active: true,
    },
  ];

  const { data: menuItemsData, error: menuError } = await supabase
    .from('menu_items')
    .upsert(menuItems, { onConflict: 'id' })
    .select();

  if (menuError) throw menuError;
  console.log('✅ Menu items created');

  // Create modifiers
  const modifiers = [
    { store_id: store.id, name: 'Size', type: 'single' as const },
    { store_id: store.id, name: 'Milk', type: 'single' as const },
    { store_id: store.id, name: 'Extra Shots', type: 'multi' as const },
    { store_id: store.id, name: 'Syrups', type: 'multi' as const },
  ];

  const { data: modifiersData, error: modifiersError } = await supabase
    .from('modifiers')
    .upsert(modifiers, { onConflict: 'id' })
    .select();

  if (modifiersError) throw modifiersError;
  console.log('✅ Modifiers created');

  // Link modifiers to items
  const sizeModifier = modifiersData.find((m) => m.name === 'Size')!;
  const milkModifier = modifiersData.find((m) => m.name === 'Milk')!;
  const shotsModifier = modifiersData.find((m) => m.name === 'Extra Shots')!;
  const syrupsModifier = modifiersData.find((m) => m.name === 'Syrups')!;

  const itemModifiers = [
    // Espresso
    { item_id: menuItemsData[0].id, modifier_id: sizeModifier.id },
    { item_id: menuItemsData[0].id, modifier_id: shotsModifier.id },
    // Cappuccino
    { item_id: menuItemsData[1].id, modifier_id: sizeModifier.id },
    { item_id: menuItemsData[1].id, modifier_id: milkModifier.id },
    { item_id: menuItemsData[1].id, modifier_id: shotsModifier.id },
    // Iced Latte
    { item_id: menuItemsData[2].id, modifier_id: sizeModifier.id },
    { item_id: menuItemsData[2].id, modifier_id: milkModifier.id },
    { item_id: menuItemsData[2].id, modifier_id: syrupsModifier.id },
    // Hot Chocolate
    { item_id: menuItemsData[3].id, modifier_id: sizeModifier.id },
    { item_id: menuItemsData[3].id, modifier_id: milkModifier.id },
  ];

  const { error: itemModifiersError } = await supabase
    .from('item_modifiers')
    .upsert(itemModifiers, { onConflict: 'item_id,modifier_id' });

  if (itemModifiersError) throw itemModifiersError;
  console.log('✅ Item modifiers linked');

  console.log('🎉 Seeding complete!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

