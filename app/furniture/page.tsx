import Image from "next/image";
import Link from "next/link";
import { furnitureCategoryLabels, furnitureItems } from "@/lib/furniture";
import { formatPrice } from "@/lib/format";

const categoryOrder = ["sofa", "bed", "table", "storage", "kitchen", "bathroom", "lighting", "decor"] as const;

export default function FurniturePage() {
  const totalCount = furnitureItems.length;
  const discountedCount = furnitureItems.filter((item) => item.oldPrice).length;

  return (
    <main>
      <section className="furniture-hero">
        <div>
          <span className="eyebrow">Магазин мебели</span>
          <h1>Подберите мебель под планировку квартиры</h1>
          <p>
            Здесь собран демонстрационный каталог мебели для кухни-гостиной, спальни, детской, прихожей,
            гардеробной и санузла. Позже этот раздел можно связать с реальным складом или CRM магазина.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#furniture-list">
              Смотреть мебель
            </a>
            <Link className="button button-ghost" href="/#apartments">
              Вернуться к квартирам
            </Link>
          </div>
        </div>
        <aside className="furniture-summary-card">
          <strong>{totalCount}</strong>
          <span>позиций в каталоге</span>
          <small>{discountedCount} товара со скидкой</small>
        </aside>
      </section>

      <section className="section furniture-section" id="furniture-list">
        <div className="section-heading">
          <span className="eyebrow">Каталог</span>
          <h2>Список мебели</h2>
          <p>Карточки можно использовать как основу будущего магазина: добавить корзину, фильтры, оплату и заявки.</p>
        </div>

        <div className="furniture-category-nav" aria-label="Категории мебели">
          {categoryOrder.map((category) => (
            <a href={`#${category}`} key={category}>
              {furnitureCategoryLabels[category]}
            </a>
          ))}
        </div>

        <div className="furniture-groups">
          {categoryOrder.map((category) => {
            const items = furnitureItems.filter((item) => item.category === category);

            if (items.length === 0) {
              return null;
            }

            return (
              <section className="furniture-group" id={category} key={category}>
                <div className="furniture-group-heading">
                  <h3>{furnitureCategoryLabels[category]}</h3>
                  <span>{items.length} шт.</span>
                </div>
                <div className="furniture-grid">
                  {items.map((item) => (
                    <article className="furniture-card" key={item.id}>
                      <div className={`furniture-visual furniture-visual-${item.category}`}>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={640}
                            height={650}
                            className="furniture-image"
                          />
                        ) : (
                          <span>{furnitureCategoryLabels[item.category]}</span>
                        )}
                      </div>
                      <div className="furniture-card-body">
                        <div className="furniture-card-topline">
                          <span>{item.room}</span>
                          {item.oldPrice ? <strong>Скидка</strong> : null}
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                        <div className="furniture-price-row">
                          <strong>{formatPrice(item.price)}</strong>
                          {item.oldPrice ? <s>{formatPrice(item.oldPrice)}</s> : null}
                        </div>
                        <dl className="furniture-specs">
                          <div>
                            <dt>Размер</dt>
                            <dd>{item.dimensions}</dd>
                          </div>
                          <div>
                            <dt>Материал</dt>
                            <dd>{item.material}</dd>
                          </div>
                          <div>
                            <dt>Цвет</dt>
                            <dd>{item.color}</dd>
                          </div>
                          <div>
                            <dt>Доставка</dt>
                            <dd>{item.delivery}</dd>
                          </div>
                        </dl>
                        <div className="furniture-tags">
                          {item.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        <button className="button button-primary furniture-button" type="button">
                          Оставить заявку
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
