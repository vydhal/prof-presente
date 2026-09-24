import * as React from "react";
import { format } from "date-fns"; // Adicione este import
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useNavigation } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 2. Criamos um componente separado para o Caption para podermos usar o hook
function CustomCaption({
  displayMonth,
  fromDate,
  toDate,
  fromYear,
  toYear,
  locale,
}) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();

  const months = Array.from(
    { length: 12 },
    (_, i) => new Date(displayMonth.getFullYear(), i, 1)
  );
  const years = [];
  const startYear = fromYear || fromDate?.getFullYear() || 1930;
  const endYear = toYear || toDate?.getFullYear() || new Date().getFullYear();
  for (let i = startYear; i <= endYear; i++) {
    years.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {/* Botão de mês anterior */}
      <Button
        variant="outline"
        className="h-7 w-7 p-0"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Selects de Mês e Ano */}
      <Select
        value={String(displayMonth.getMonth())}
        onValueChange={(value) => {
          const newDate = new Date(displayMonth.getFullYear(), parseInt(value));
          goToMonth(newDate); // 3. Usamos goToMonth para navegar
        }}
      >
        <SelectTrigger className="w-[120px] focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month, i) => (
            <SelectItem key={i} value={String(i)}>
              {format(month, "MMMM", { locale })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(displayMonth.getFullYear())}
        onValueChange={(value) => {
          const newDate = new Date(parseInt(value), displayMonth.getMonth());
          goToMonth(newDate); // 3. Usamos goToMonth para navegar
        }}
      >
        <SelectTrigger className="w-[80px] focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão de próximo mês */}
      <Button
        variant="outline"
        className="h-7 w-7 p-0"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        caption_dropdowns: "flex items-center gap-2",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        // 4. Usamos nosso novo CustomCaption como o componente para o cabeçalho
        Caption: (captionProps) => (
          <CustomCaption {...captionProps} locale={props.locale} />
        ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
