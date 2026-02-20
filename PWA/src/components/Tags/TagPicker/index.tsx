import { useEffect, useMemo, useState } from "react";
import Lucide from "@/components/Base/Lucide";
import { FormInput } from "@/components/Base/Form";
import { suggestTagTerms, type TagTerm } from "@/services/taxonomy";

type TagPickerProps = {
  taxonomyKey: string;
  value: TagTerm[];
  onChange: (tags: TagTerm[]) => void;
  placeholder?: string;
};

function TagPicker({ taxonomyKey, value, onChange, placeholder = "Add tags" }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagTerm[]>([]);
  const selectedIds = useMemo(() => new Set(value.map((tag) => tag.id)), [value]);

  useEffect(() => {
    if (!taxonomyKey || !query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const rows = await suggestTagTerms(taxonomyKey, query.trim());
        setSuggestions(rows.filter((row) => !selectedIds.has(row.id)));
      } catch {
        setSuggestions([]);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [taxonomyKey, query, selectedIds]);

  const addTag = (tag: TagTerm) => {
    if (selectedIds.has(tag.id)) return;
    onChange([...value, tag]);
    setQuery("");
    setSuggestions([]);
  };

  const addCustomTag = () => {
    const label = query.trim();
    if (!label) return;
    const normalized = label.toLowerCase();
    if (value.some((tag) => tag.label.toLowerCase() === normalized)) {
      setQuery("");
      return;
    }

    onChange([
      ...value,
      {
        id: `new:${normalized}`,
        value: normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "tag",
        label,
      },
    ]);
    setQuery("");
    setSuggestions([]);
  };

  const removeTag = (tagId: string) => {
    onChange(value.filter((tag) => tag.id !== tagId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {tag.label}
            <button type="button" className="text-slate-500 hover:text-slate-900" onClick={() => removeTag(tag.id)}>
              <Lucide icon="XCircle" className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      <FormInput
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addCustomTag();
          }
        }}
      />

      {query.trim() ? (
        <div className="rounded-md border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
            onClick={addCustomTag}
          >
            <span>Create tag "{query.trim()}"</span>
            <Lucide icon="Plus" className="h-4 w-4 text-slate-500" />
          </button>
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
              onClick={() => addTag(item)}
            >
              <span>{item.label}</span>
              <Lucide icon="FileText" className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default TagPicker;
