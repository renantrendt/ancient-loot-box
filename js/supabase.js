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
    if (!userId) {
      console.error('User ID is required to save inventory')
      return false
    }

    // First, delete any existing inventory for this user to avoid duplicates
    await supabase
      .from('inventories')
      .delete()
      .eq('user_id', userId)

    // Convert inventory object to array of inventory items
    const inventoryItems = Object.entries(inventory).map(([itemName, details]) => ({
      user_id: userId,
      item_name: itemName,
      count: details.count,
      rarity: details.rarity
    }))

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
    // Always use the current origin as the redirect URL
    // This ensures we return to the same URL we started from
    const redirectUrl = window.location.origin;
      
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
