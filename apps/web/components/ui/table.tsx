import * as React from 'react';
import { cn } from '@/lib/cn';

interface TableContainerProps {
  className?: string;
  children: React.ReactNode;
}

export function TableContainer({ className, children }: TableContainerProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      {children}
    </div>
  );
}

export function Table({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...props}
      className={cn('w-full text-sm border-collapse', className)}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={cn('bg-neutral-50 border-b border-neutral-200', className)}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      {...props}
      className={cn('divide-y divide-neutral-100', className)}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn(
        'transition-colors hover:bg-neutral-50/80',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        'px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={cn('px-4 py-3 text-neutral-700 align-middle', className)}
    >
      {children}
    </td>
  );
}
