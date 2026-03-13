import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
    id: string; // Puede ser product.id o el slug
    name: string;
    price: number;
    imageUrl: string;
    slug?: string;
    category?: string;
    compareAtPrice?: number | null;
}

interface WishlistState {
    items: WishlistItem[];
    addItem: (item: WishlistItem) => void;
    removeItem: (id: string) => void;
    toggleItem: (item: WishlistItem) => void;
    clearWishlist: () => void;
    isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                set((state) => {
                    // Si ya existe, no lo agregamos duplicado
                    if (state.items.find((i) => i.id === item.id)) {
                        return { items: state.items };
                    }
                    return { items: [...state.items, item] };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }));
            },

            toggleItem: (item) => {
                const { items, addItem, removeItem } = get();
                const exists = items.some((i) => i.id === item.id);

                if (exists) {
                    removeItem(item.id);
                } else {
                    addItem(item);
                }
            },

            clearWishlist: () => {
                set({ items: [] });
            },

            isInWishlist: (id) => {
                return get().items.some((item) => item.id === id);
            },
        }),
        {
            name: "wishlist-storage", // name of the item in the storage (must be unique)
        }
    )
);
