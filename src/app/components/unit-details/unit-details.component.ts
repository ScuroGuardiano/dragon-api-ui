import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UnitProp } from '../../common/unit-prop.decorator';
import { catchError, of, retry, switchMap } from 'rxjs';
import { Path, UnitService } from '../../services/unit.service';
import { AsyncPipe } from '@angular/common';
import { GLYPHS } from '../../common/glyphs';
import { UnitLinkComponent } from "../unit-link/unit-link.component";

@Component({
    selector: 'app-unit-details',
    standalone: true,
    templateUrl: './unit-details.component.html',
    styleUrl: './unit-details.component.scss',
    imports: [AsyncPipe, UnitLinkComponent]
})
export class UnitDetailsComponent {
  unitService = inject(UnitService);
  /**
  * If it's starting with `/` then it's treated as a path,
  * otherwise it's treated as a name
  */
  unitPathOrName = input.required<string>();
  error = signal<any>(undefined);

  unitInfo$ = toObservable(this.unitPathOrName).pipe(
    switchMap(pathOrName => {
      let stream;
      if (pathOrName.startsWith("/")) {
        stream = this.unitService.getUnitPropertiesToObject(new Path(pathOrName), UnitStatusInfo);
      }
      else {
        stream = this.unitService.getUnitPropertiesToObjectByName(pathOrName, UnitStatusInfo);
      }

      return stream.pipe(
        retry(3),
        catchError(err => of(this.handleError(err)))
      )
    })
  );

  unitInfo = toSignal(this.unitInfo$);

  activeGlyph = computed(() => {
    const active = this.unitInfo()?.activeState;
    if (active) {
      switch (active) {
        case "active": return GLYPHS.BLACK_CIRCLE;
        case "reloading": return GLYPHS.CIRCLE_ARROW;
        case "inactive": return GLYPHS.WHITE_CIRCLE;
        case "failed": return GLYPHS.MULTIPLICATION_SIGN;
        case "activating": return GLYPHS.BLACK_CIRCLE;
        case "deactivating": return GLYPHS.BLACK_CIRCLE;
        case "maintenance": return GLYPHS.WHITE_CIRCLE;
      }
    }
    return "";
  });

  activeClass = computed(() => {
    const active = this.unitInfo()?.activeState;
    switch (active) {
      case "failed": return "error";

      case "active":
      case "reloading":
        return "success";

      default: return "";
    }
  });

  loadClass = computed(() => {
    const loadState = this.unitInfo()?.loadState;
    if (loadState && ["error", "not-found", "bad-setting"].includes(loadState)) {
      return "error";
    }
    if (loadState === "loaded") {
      return "success";
    }
    return "";
  });

  enableClass = computed(() => {
    const enableState = this.unitInfo()?.unitFileState;
    return this.getEnableClass(enableState ?? "");
  });

  presetClass = computed(() => {
    const presetState = this.unitInfo()?.unitFilePreset;
    return this.getEnableClass(presetState ?? "");
  })

  unitFilePath = computed(() => {
    const i = this.unitInfo();
    if (!i) return "";
    return i.sourcePath || i.fragmentPath;
  })

  isEmpty(s: string | undefined | null) {
    if (!s) {
      return true;
    }
    if (!s.trim()) {
      return true;
    }
    return false;
  }

  private handleError(err: any) {
    console.error(err);
    this.error.set(err);
    return null;
  }

  private getEnableClass(enableState: string) {
    switch(enableState) {
      case "enabled": return "success";
      case "disabled": return "warning";
      default: return "";
    }
  }
}

class UnitStatusInfo {
  @UnitProp("Id") id!: string;
  @UnitProp("LoadState") loadState!: string;
  @UnitProp("ActiveState") activeState!: string;
  @UnitProp("FreezerState") freezerState!: string;
  @UnitProp("SubState") subState!: string;
  @UnitProp("UnitFileState") unitFileState!: string;
  @UnitProp("UnitFilePreset") unitFilePreset!: string;

  @UnitProp("Description") description!: string;
  @UnitProp("Following") following!: string;

  @UnitProp("Documentation") documentation!: string[];

  @UnitProp("FragmentPath") fragmentPath!: string;
  @UnitProp("SourcePath") sourcePath!: string;
  @UnitProp("ControlGroup") controlGroup!: string;

  @UnitProp("DropinPaths") dropinPaths!: string[];

  @UnitProp("TriggeredBy") triggeredBy!: string[];
  @UnitProp("Triggers") triggers!: string[];

  @UnitProp("LoadError") loadError!: [string, string];
  @UnitProp("Result") result!: string;

  @UnitProp("InactiveExitTimestamp") inactiveExitTimestamp!: number;
  @UnitProp("InactiveExitTimestampMonotonic") inactiveExitTimestampMonotonic!: number;
  @UnitProp("ActiveEnterTimestamp") activeEnterTimestamp!: number;
  @UnitProp("ActiveExitTImestamp") activeExitTimestamp!: number;
  @UnitProp("InactiveEnterTimestamp") inactiveEnterTimestamp!: number;

  @UnitProp("RuntimeMaxSec") runtimeMaxSec!: number;

  @UnitProp("InvocationId") invocationId!: string;

  @UnitProp("NeedDaemonReload") needDaemonReload!: boolean;
  @UnitProp("Transient") transient!: boolean;

  // Service
  @UnitProp("MainPID") mainPid?: number;
  @UnitProp("ControlPID") controlPid?: number;
  @UnitProp("StatusText") statusText?: string;
  @UnitProp("PIDFile") pidFile?: string;
  @UnitProp("Running") running?: boolean;
  @UnitProp("StatusErrno") statusErrno?: number;

  @UnitProp("FDStoreMax") fdStoreMax?: number;
  @UnitProp("NFDStore") nFdStore?: number;

  @UnitProp("StartTimetamp") startTimestamp?: number;
  @UnitProp("ExitTimestamp") exitTimestamp?: number;

  @UnitProp("ExitCode") exitCode?: number;
  @UnitProp("ExitStatus") exitStatus?: number;

  @UnitProp("LogNamespace") logNamespace?: string;

  @UnitProp("ConditionTimestamp") conditionTimestamp?: number;
  @UnitProp("ConditionResult") conditionResult?: boolean;

  // Fields are: name, param, trigger, negate, tristate.
  @UnitProp<[string, string, boolean, boolean, number][], IUnitCondition[]>(
    "Conditions",
    v => v.map(x => ({ name: x[0], param: x[1], trigger: x[2], negate: x[3], tristate: x[4] }))
  )
  conditions?: IUnitCondition[];

  @UnitProp("AssertTimestamp") assertTimestamp?: number;
  @UnitProp("AssertResult") assertResult?: boolean;
  @UnitProp("FailedAssertTrigger") failedAssertTrigger?: boolean;
  @UnitProp("FailedAssertNegate") failedAssertNegate?: boolean;
  @UnitProp("FailedAssert") failedAssert?: string;
  @UnitProp("FailedAssertParameter") failedAssertParameter?: string;
  @UnitProp("NextElapseReal") nextElapseReal?: number;
  @UnitProp("NextElapseMonotonic") nextElapseMonotonic?: number;

  // Socket
  @UnitProp("NAccepted") nAccepted?: number;
  @UnitProp("NConnections") nConnections?: number;
  @UnitProp("NRefused") nRefused?: number;
  @UnitProp("Accept") accept?: boolean;

  // Pairs of type, path
  // TODO: Find a way to parse it nicely into array of objects
  @UnitProp<[string, string][], ISocketListen[]>(
    "Listen",
    v => v.map(x => ({ type: x[0], path: x[1] }))
  )
  listen?: ISocketListen[];

  // Device
  @UnitProp("SysFSPath") sysFsPath?: string;

  // Mount, Automount
  @UnitProp("Where") where?: string;

  // Swap
  @UnitProp("What") what?: string;

  // CGroup
  @UnitProp("MemoryCurrent") memoryCurrent?: number;
  @UnitProp("MemoryPeak") memoryPeak?: number;
  @UnitProp("MemorySwapCurrent") memorySwapCurrent?: number;
  @UnitProp("MemorySwapPeak") memorySwapPeak?: number;
  @UnitProp("MemoryZSwapCurrent") memoryZSwapCurrent?: number;
  @UnitProp("MemoryAvailable") memoryAvailable?: number;
  @UnitProp("DefaultMemoryMin") defaultMemoryMin?: number;
  @UnitProp("DefaultMemoryLow") defaultMemoryLow?: number;
  @UnitProp("DefaultStartupMemoryLow") defaultStartupMemoryLow?: number;
  @UnitProp("MemoryMin") memoryMin?: number;
  @UnitProp("MemoryLow") memoryLow?: number;
  @UnitProp("StartupMemoryLow") startupMemoryLow?: number;
  @UnitProp("MemoryHigh") memoryHigh?: number;
  @UnitProp("StartupMemoryHigh") startupMemoryHigh?: number;
  @UnitProp("MemoryMax") memoryMax?: number;
  @UnitProp("StartupMemoryMax") startupMemoryMax?: number;
  @UnitProp("MemorySwapMax") memorySwapMax?: number;
  @UnitProp("StartupMemorySwapMax") startupMemorySwapMax?: number;
  @UnitProp("MemoryZSwapMax") memoryZSwapMax?: number;
  @UnitProp("StartupMemoryZSwapMax") startupMemoryZSwapMax?: number;
  @UnitProp("MemoryLimit") memoryLimit?: number;

  @UnitProp("CPUUsageNSec") cpuUsageNSec?: number;
  @UnitProp("TasksCurrent") tasksCurrent?: number;
  @UnitProp("TasksMax") tasksMax?: number;
  @UnitProp("IPIngressBytes") ipIngressBytes?: number;
  @UnitProp("IPEgressBytes") ipEgressBytes?: number;
  @UnitProp("IOReadBytes") ioReadBytes?: number;
  @UnitProp("IOWriteBytes") ioWriteBytes?: number;

  // TODO: Execs. Do I even need those Exec lists?
}

interface IUnitCondition {
  name: string;
  param: string;
  trigger: boolean;
  negate: boolean;
  tristate: number;
}

interface ISocketListen {
  type: string;
  path: string;
}
