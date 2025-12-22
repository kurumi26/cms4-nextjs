interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
}: SearchBarProps) {
  return (
    <div className="d-flex justify-content-between mb-3">
      <div>
        <button className="btn btn-outline-secondary me-2">Filters</button>
        <button className="btn btn-outline-secondary">Actions</button>
      </div>

      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ maxWidth: 260 }}
      />
    </div>
  );
}
