import type { NewsCategory } from "@/types/news";

type CategoryTabsProps = {
  categories: { id: NewsCategory; label: string }[];
  selectedCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
};

const accentClasses: Record<NewsCategory, string> = {
  wirtschaft: "data-[active=true]:border-blue-400/55 data-[active=true]:text-blue-100",
  politik: "data-[active=true]:border-violet-300/55 data-[active=true]:text-violet-100",
  handball: "data-[active=true]:border-red-300/55 data-[active=true]:text-red-100",
};

export function CategoryTabs({ categories, selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Kategorie">
      {categories.map((category) => {
        const active = selectedCategory === category.id;

        return (
          <button
            aria-selected={active}
            className={`min-h-11 rounded-md border bg-surface px-2 text-sm font-medium text-muted transition hover:text-ink data-[active=true]:bg-panel ${accentClasses[category.id]} ${
              active ? "border-line" : "border-transparent"
            }`}
            data-active={active}
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            role="tab"
            type="button"
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
