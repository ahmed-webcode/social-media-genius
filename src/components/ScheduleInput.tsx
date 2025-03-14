
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScheduleInputProps = {
  scheduledTime: Date;
  onChange: (value: Date) => void;
};

const ScheduleInput = ({ scheduledTime, onChange }: ScheduleInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="scheduledTime" className="text-lg font-medium">Schedule Time (GMT+3)</Label>
      <Input
        id="scheduledTime"
        type="datetime-local"
        value={scheduledTime.toISOString().slice(0, 16)}
        onChange={(e) => onChange(new Date(e.target.value))}
        className="text-base"
      />
    </div>
  );
};

export default ScheduleInput;
