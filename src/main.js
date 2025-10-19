/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const {
        discount,
        sale_price,
        quantity
    } = purchase;

    return sale_price * quantity * (1 - (discount / 100));
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const {
        profit
    } = seller;
    if (index == 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.1;
    } else if (index > 2 && index < (total - 1)) {
        return profit * 0.05;
    } else if (index === (total - 1)) {
        return 0;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (typeof options != "object") {
        throw new Error('Не передан объект');
    }
    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Проверка входных данных
    if (!data || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records) || data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Чего-то не хватает');
    }



    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        bonus: 0,
        top_products: {},
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = data.sellers.reduce((result, item) => ({
        ...result,
        [item.id]: item
    }), {})

    const productIndex = data.products.reduce((result, item) => ({
            ...result,
            [item.sku]: item
        }), {})
        // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id]; //продавец в чеке 

        let index = sellerStats.reduce((acc, item, index) => {
            if (item.id === seller.id) {
                return index;
            }
            return acc;
        }, -1);
        if (record.items.length > 0) {
            sellerStats[index].sales_count += 1;
        }


        record.items.forEach(item => {
            //считаем выручку 
            let cost_price = productIndex[item.sku].purchase_price * item.quantity;
            let revenue = calculateRevenue(item, productIndex[item.sku]);
            let profit = revenue - cost_price;
            sellerStats[index].revenue += revenue;
            sellerStats[index].profit += profit;
            if (!sellerStats[index].products_sold[item.sku]) {
                sellerStats[index].products_sold[item.sku] = 0;
            }
            sellerStats[index].products_sold[item.sku] += item.quantity;
        })
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold).map((value) => {
            return {
                sku: value[0],
                quantity: value[1]
            }
        });
        seller.top_products.sort((a, b) => b.quantity - a.quantity);
        seller.top_products = seller.top_products.slice(0, 10);
    })

    // @TODO: Подготовка итоговой коллекции с нужными 
    return sellerStats.map(function(seller) {
        return {
            seller_id: seller.id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: +seller.bonus.toFixed(2)
        }
    })
}

/*
[{
    seller_id: 'seller_1', // Идентификатор продавца
    name: 'Alexey Petrov', // Имя и фамилия продавца
    revenue: 123456, // Общая выручка с учётом скидок
    profit: 12345, // Прибыль от продаж продавца
    sales_count: 20, // Количество продаж
    top_products: [  // Топ-10 проданных товаров в штуках
        {
            sku: 'SKU_001', // Артикул товара
            quantity: 12, // Сколько продано
        },
    ],
    bonus: 1234, // Итоговый бонус в рублях, не процент
}];
*/