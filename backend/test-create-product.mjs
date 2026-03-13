// Utilizando native fetch de Node >= 18

async function testCreateProduct() {
    const skuSuffix = Math.floor(Math.random() * 100000);

    const payload = {
        name: "Playera Test Variante Script",
        slug: "script-test-variante-" + skuSuffix,
        price: 799,
        compareAtPrice: 999,
        description: "Testing API from node script",
        brand: "TestBrand",
        variants: [
            {
                sku: "TEST-SKU-001-" + skuSuffix,
                size: "M",
                color: "Rojo",
                audience: "HOMBRE",
                sleeve: "SHORT",
                hasLeaguePatch: false,
                hasChampionsPatch: false,
                allowsNameNumber: true,
                customizationPrice: 19900, // 199 MXN
                isDropshippable: false,
                priceCents: 79900,
                compareAtPriceCents: 99900,
                costCents: 0,
                currency: "MXN",
                stock: 5,
                weightGrams: 200,
            },
            {
                sku: "TEST-SKU-002-" + skuSuffix,
                size: "L",
                color: "Azul",
                audience: "MUJER",
                sleeve: "SHORT",
                hasLeaguePatch: false,
                hasChampionsPatch: false,
                allowsNameNumber: false,
                customizationPrice: 0,
                isDropshippable: true,
                priceCents: 79900,
                compareAtPriceCents: null,
                costCents: 0,
                currency: "MXN",
                stock: 0,
                weightGrams: 200,
            }
        ]
    };

    try {
        const res = await fetch('http://localhost:4000/api/v1/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));

        if (res.ok && data.id) {
            console.log("SUCCESS! Created product ID:", data.id);
            console.log("Variants created:", data.variants?.length);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testCreateProduct();
