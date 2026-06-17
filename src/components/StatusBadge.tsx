import type { OrderStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

interface Props {
  status: OrderStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
