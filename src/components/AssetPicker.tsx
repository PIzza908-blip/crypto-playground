import { coinBy } from "@/lib/coins";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AssetPicker({
  value,
  onChange,
  assets,
}: {
  value: string;
  onChange: (asset: string) => void;
  assets: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {assets.map((asset) => {
          const coin = coinBy(asset);
          return (
            <SelectItem key={asset} value={asset}>
              <span className="mr-2">{coin.emoji}</span>
              {coin.name} · {asset}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
