// Supabase client configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm'

// Supabase configuration
const supabaseUrl = 'https://zjpbyepiilmxbzuhmtej.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqcGJ5ZXBpaWxteGJ6dWhtdGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTQ0MjAsImV4cCI6MjA1NzczMDQyMH0.sTim-uO67S9I0RWvPE5Mtwnb9SVAMItFJ4W_BqlJoT0'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Current user functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Inventory management with Supabase
export const saveInventoryToSupabase = async (userId, inventory) => {
  try {
    console.log('saveInventoryToSupabase called with:', { userId, inventory });
    
    if (!userId) {
      console.error('User ID is required to save inventory')
      return false
    }

    // First, delete any existing inventory for this user to avoid duplicates
    console.log('Deleting existing inventory for user:', userId);
    const { error: deleteError } = await supabase
      .from('inventories')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing inventory:', deleteError);
      return false;
    }

    // Convert inventory object to array of inventory items
    const inventoryItems = Object.entries(inventory).map(([itemName, details]) => ({
      user_id: userId,
      item_name: itemName,
      count: details.count,
      rarity: details.rarity
    }))

    console.log('Inserting inventory items:', inventoryItems);

    // Insert all inventory items
    const { error } = await supabase
      .from('inventories')
      .insert(inventoryItems)

    if (error) {
      console.error('Error saving inventory to Supabase:', error)
      return false
    }

    console.log('Inventory saved to Supabase successfully')
    return true
  } catch (error) {
    console.error('Failed to save inventory to Supabase:', error)
    return false
  }
}

export const loadInventoryFromSupabase = async (userId) => {
  try {
    if (!userId) {
      console.error('User ID is required to load inventory')
      return null
    }

    const { data, error } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error loading inventory from Supabase:', error)
      return null
    }

    // Convert array back to the inventory object format used in the app
    const inventory = {}
    
    // First get the item details for price info
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
    
    if (itemsError) {
      console.error('Error loading items from Supabase:', itemsError)
    }
    
    // Create a map of item prices
    const itemPrices = {}
    if (itemsData) {
      itemsData.forEach(item => {
        itemPrices[item.item_name] = item.price
      })
    }

    // Convert inventory items to the format used by the app
    data.forEach(item => {
      inventory[item.item_name] = {
        count: item.count,
        rarity: item.rarity,
        price: itemPrices[item.item_name] || 0 // Use stored price or default to 0
      }
    })

    console.log('Inventory loaded from Supabase successfully')
    return inventory
  } catch (error) {
    console.error('Failed to load inventory from Supabase:', error)
    return null
  }
}

// Google authentication methods
export const signInWithGoogle = async () => {
  try {
    // Use the current origin as the redirect URL
    // This ensures we return to localhost when developing locally
    const redirectUrl = window.location.origin + window.location.pathname;
    
    console.log('OAuth redirect URL:', redirectUrl);
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        // Add scopes for accessing Google data if needed
        scopes: 'email profile',
        // Use queryParams to ensure proper redirection
        queryParams: {
          // Force re-consent to ensure we can log out properly
          prompt: 'consent',
          // Access type offline to get refresh token
          access_type: 'offline'
        }
      }
    })
    
    if (error) {
      console.error('Error signing in with Google:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to sign in with Google:', error)
    return { success: false, error }
  }
}

export const signOut = async () => {
  try {
    // Use the more comprehensive signOut method with options
    const { error } = await supabase.auth.signOut({
      // Clear all storage and session data
      scope: 'global'
    })
    
    if (error) {
      console.error('Error signing out:', error)
      return false
    }
    
    // Force reload the page to ensure all state is cleared
    window.location.reload()
    return true
  } catch (error) {
    console.error('Failed to sign out:', error)
    return false
  }
}

// High Stakes inventory management
export const saveHighStakesInventoryToSupabase = async (userId, inventory) => {
  try {
    if (!userId) {
      console.error('❌ [HIGH STAKES SUPABASE] User ID is required to save High Stakes inventory')
      return false
    }

    if (!inventory || typeof inventory !== 'object') {
      console.error('❌ [HIGH STAKES SUPABASE] Invalid inventory object provided')
      return false
    }

    console.log('💾 [HIGH STAKES SUPABASE] Saving inventory for user:', userId)
    console.log('📦 [HIGH STAKES SUPABASE] Inventory to save:', Object.keys(inventory).length, 'items')

    // First, delete any existing High Stakes inventory for this user
    const { error: deleteError } = await supabase
      .from('high_stakes_inventory')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ [HIGH STAKES SUPABASE] Error deleting existing inventory:', deleteError)
      return false
    }

    // Convert inventory object to array of inventory items
    const inventoryItems = Object.entries(inventory).map(([itemName, details]) => ({
      user_id: userId,
      item_name: itemName,
      item_count: details.count || 0,
      item_rarity: details.rarity || 'common',
      item_price: details.price || 0
    }))

    // Only insert if there are items to save
    if (inventoryItems.length > 0) {
      const { error } = await supabase
        .from('high_stakes_inventory')
        .insert(inventoryItems)

      if (error) {
        console.error('❌ [HIGH STAKES SUPABASE] Error saving inventory:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        return false
      }
    }

    console.log('✅ [HIGH STAKES SUPABASE] Successfully saved inventory:', inventoryItems.length, 'items')
    return true
  } catch (error) {
    console.error('❌ [HIGH STAKES SUPABASE] Failed to save inventory:', error)
    console.error('Error stack:', error.stack)
    return false
  }
}

export const loadHighStakesInventoryFromSupabase = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ [HIGH STAKES SUPABASE] User ID is required to load High Stakes inventory')
      return null
    }

    console.log('🔄 [HIGH STAKES SUPABASE] Loading inventory for user:', userId)
    const { data, error } = await supabase
      .from('high_stakes_inventory')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ [HIGH STAKES SUPABASE] Error loading High Stakes inventory:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      return null
    }

    console.log('📦 [HIGH STAKES SUPABASE] Raw data from Supabase:', data)

    // Convert array back to the inventory object format used in the app
    const inventory = {}
    
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (item && item.item_name) {
          inventory[item.item_name] = {
            count: item.item_count || 0,
            rarity: item.item_rarity || 'common',
            price: item.item_price || 0
          }
        }
      })
    }

    console.log('✅ [HIGH STAKES SUPABASE] Successfully loaded and converted inventory:', Object.keys(inventory).length, 'items')
    return inventory
  } catch (error) {
    console.error('❌ [HIGH STAKES SUPABASE] Failed to load High Stakes inventory:', error)
    console.error('Error stack:', error.stack)
    return null
  }
}

// High Stakes mode state management
export const saveHighStakesModeStateToSupabase = async (userId, isHighStakesMode, normalInventoryBackup) => {
  try {
    if (!userId) {
      console.error('User ID is required to save High Stakes mode state')
      return false
    }

    const { error } = await supabase
      .from('high_stakes_mode_state')
      .upsert({
        user_id: userId,
        is_high_stakes_mode: isHighStakesMode,
        normal_inventory_backup: normalInventoryBackup
      })

    if (error) {
      console.error('Error saving High Stakes mode state to Supabase:', error)
      return false
    }

    console.log('High Stakes mode state saved to Supabase successfully')
    return true
  } catch (error) {
    console.error('Failed to save High Stakes mode state to Supabase:', error)
    return false
  }
}

export const loadHighStakesModeStateFromSupabase = async (userId) => {
  try {
    if (!userId) {
      console.error('User ID is required to load High Stakes mode state')
      return null
    }

    const { data, error } = await supabase
      .from('high_stakes_mode_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found, user hasn't used High Stakes mode
        return null
      }
      console.error('Error loading High Stakes mode state from Supabase:', error)
      return null
    }

    console.log('High Stakes mode state loaded from Supabase successfully')
    return {
      isHighStakesMode: data.is_high_stakes_mode,
      normalInventoryBackup: data.normal_inventory_backup
    }
  } catch (error) {
    console.error('Failed to load High Stakes mode state from Supabase:', error)
    return null
  }
}

// High Stakes Shop Purchase management
export const saveShopPurchaseToSupabase = async (userId, itemId) => {
  try {
    if (!userId) {
      console.error('🛒 [SHOP SUPABASE] User ID is required to save shop purchase')
      return false
    }

    if (!itemId) {
      console.error('🛒 [SHOP SUPABASE] Item ID is required to save shop purchase')
      return false
    }

    console.log(`🛒 [SHOP SUPABASE] Saving shop purchase: ${itemId} for user: ${userId}`)

    const { error } = await supabase
      .from('high_stakes_shop_purchases')
      .insert({
        user_id: userId,
        item_id: itemId
      })

    if (error) {
      // Check if it's a unique constraint violation (user already purchased this item)
      if (error.code === '23505') {
        console.log(`🛒 [SHOP SUPABASE] User has already purchased ${itemId}`)
        return true // Not an error, just already purchased
      }
      // Check if table doesn't exist (406 Not Acceptable or 42P01 table does not exist)
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('Not Acceptable')) {
        console.warn('⚠️ [SHOP SUPABASE] high_stakes_shop_purchases table does not exist in Supabase. Shop purchases will only be saved locally.')
        return false
      }
      console.error('🛒 [SHOP SUPABASE] Error saving shop purchase:', error)
      return false
    }

    console.log(`✅ [SHOP SUPABASE] Successfully saved shop purchase: ${itemId}`)
    return true
  } catch (error) {
    console.error('🛒 [SHOP SUPABASE] Failed to save shop purchase:', error)
    return false
  }
}

export const loadShopPurchasesFromSupabase = async (userId) => {
  try {
    if (!userId) {
      console.error('🛒 [SHOP SUPABASE] User ID is required to load shop purchases')
      return {}
    }

    console.log(`🛒 [SHOP SUPABASE] Loading shop purchases for user: ${userId}`)

    const { data, error } = await supabase
      .from('high_stakes_shop_purchases')
      .select('item_id')
      .eq('user_id', userId)

    if (error) {
      // Check if table doesn't exist (406 Not Acceptable or 42P01 table does not exist)
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('Not Acceptable')) {
        console.warn('⚠️ [SHOP SUPABASE] high_stakes_shop_purchases table does not exist in Supabase. Using local shop purchases only.')
        return {}
      }
      console.error('🛒 [SHOP SUPABASE] Error loading shop purchases:', error)
      return {}
    }

    // Convert to the format expected by the game (object with itemId: true)
    const purchases = {}
    if (data && Array.isArray(data)) {
      data.forEach(purchase => {
        if (purchase && purchase.item_id) {
          purchases[purchase.item_id] = true
        }
      })
    }

    console.log(`✅ [SHOP SUPABASE] Successfully loaded shop purchases:`, Object.keys(purchases))
    return purchases
  } catch (error) {
    console.error('🛒 [SHOP SUPABASE] Failed to load shop purchases:', error)
    return {}
  }
}

export const checkShopPurchaseFromSupabase = async (userId, itemId) => {
  try {
    if (!userId || !itemId) {
      console.error('🛒 [SHOP SUPABASE] User ID and Item ID are required to check shop purchase')
      return false
    }

    const { data, error } = await supabase
      .from('high_stakes_shop_purchases')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found, user hasn't purchased this item
        return false
      }
      // Check if table doesn't exist (406 Not Acceptable or 42P01 table does not exist)
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('Not Acceptable')) {
        console.warn(`⚠️ [SHOP SUPABASE] high_stakes_shop_purchases table does not exist in Supabase. Cannot check purchase status for ${itemId}. Using local data only.`)
        return false
      }
      console.error('🛒 [SHOP SUPABASE] Error checking shop purchase:', error)
      return false
    }

    return data !== null
  } catch (error) {
    console.error('🛒 [SHOP SUPABASE] Failed to check shop purchase:', error)
    return false
  }
}

// Helper function to check if shop purchases table exists
export const checkShopTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('high_stakes_shop_purchases')
      .select('count', { count: 'exact', head: true })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('Not Acceptable')) {
        return false
      }
    }
    return true
  } catch (error) {
    return false
  }
}
