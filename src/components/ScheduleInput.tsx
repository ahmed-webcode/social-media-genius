
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScheduleInputProps = {
  scheduledTime: Date;
  onChange: (value: Date) => void;
};

const ScheduleInput = ({ scheduledTime, onChange }: ScheduleInputProps) => {
  // Format date to local timezone for the input
  const formatDateForInput = (date: Date): string => {
    // Get local ISO string and trim off the timezone part
    const localISOString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
    return localISOString;
  };

  // Handle date change from input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Create a new date from the input value
    const newDate = new Date(e.target.value);
    onChange(newDate);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="scheduledTime" className="text-lg font-medium">Schedule Time (GMT+3)</Label>
      <Input
        id="scheduledTime"
        type="datetime-local"
        value={formatDateForInput(scheduledTime)}
        onChange={handleDateChange}
        className="text-base"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Current schedule: {scheduledTime.toLocaleString()}
      </p>
    </div>
  );
};

export default ScheduleInput;
