import { Component, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-unit-details',
  standalone: true,
  imports: [],
  templateUrl: './unit-details.component.html',
  styleUrl: './unit-details.component.scss'
})
export class UnitDetailsComponent {
  unitPath = input.required<string>();

  unitPath$ = toObservable(this.unitPath);

  readonly propertiesToRead = [
    "MainPID",                  // number
    "StatusText",               // string
    "StatusErrno",              // number
    "Result",                   // string
    "ReloadResult",             // string
    "CleanResult",              // string
    "ActiveEnterTimestamp",     // number
    "ActiveExitTimestamp",      // number
    "InactiveEnterTimestamp",   // number
    "InactiveExitTimestamp",    // number
    "Id",                       // string
    "Description",              // string
    "TriggeredBy",              // string[]
    "Triggers",                 // string[]
    "Documentation",            // string[]
    "LoadState",                // string
    "ActiveState",              // string
    "SubState",                 // string
    "SourcePath",               // string
    "FragmentPath",             // string
    "UnitFileState",            // string
    "UnitFilePreset",           // string
    "CanStart",                 // boolean
    "CanStop",                  // boolean
    "CanReload",                // boolean
    "ControlGroup",             // string
    "MemoryCurrent",            // number
    "MemoryPeak",               // number
    "CPUUsageNSec",             // number
    "TasksCurrent",             // number
    "TasksMax",                 // number
    "Following"                 // string
  ];
}
