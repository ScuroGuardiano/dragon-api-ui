import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UnitProp } from '../../common/unit-prop.decorator';
import { Observable, catchError, map, of, retry, switchMap, timestamp } from 'rxjs';
import { Path, UnitService } from '../../services/unit.service';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { GLYPHS } from '../../common/glyphs';
import { UnitLinkComponent } from "../unit-link/unit-link.component";
import { PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64, timestampIsSet } from '../../common/unit-utils';
import { UsecTimespanPipe } from '../../pipes/usec-timespan.pipe';
import { UsecTimestampRelativePipe } from '../../pipes/usec-timestamp-relative.pipe';
import { UsecTimestampPipe } from '../../pipes/usec-timestamp.pipe';
import { FormatService } from '../../services/format.service';

@Component({
  selector: 'app-unit-details',
  standalone: true,
  templateUrl: './unit-details.component.html',
  styleUrl: './unit-details.component.scss',
  imports: [
    AsyncPipe,
    UnitLinkComponent
  ]
})
export class UnitDetailsComponent {
  unitService = inject(UnitService);
  /**
  * If it's starting with `/` then it's treated as a path,
  * otherwise it's treated as a name
  */
  unitPathOrName = input.required<string>();
  error = signal<any>(undefined);

  formatService = inject(FormatService);

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
        catchError(err => of(this.handleError(err, true)))
      )
    })
  );

  unitInfo = toSignal(this.unitInfo$);
  formatted = computed(() => {
    const i = this.unitInfo();
    if (!i) {
      return [];
    }
    return this.formatUnitInfo(i);
  });

  formatUnitInfo(i: UnitStatusInfo): IUnitDetailLine[] {
    const ret = [] as IUnitDetailLine[];

    // line
    const l = (column: string, ...content: UnitDetailContent[]) => {
      ret.push({ column, content });
    }
    // async content
    const a = (value: Observable<IUnitDetailContent>): IUnitDetailContentAsync => {
      return {
        async: true,
        value
      };
    }
    // sync content
    const s = (value: string, data: { class?: string, link?: string } = {}): IUnitDetailContent => {
      return { async: false, value, class: data.class, link: data.link };
    }


    if (i.following) {
      l(
        "Follows",
        s("unit currently follows state of "),
        s(i.following, { link: i.following })
      );
    }

    // Loaded
    {
      let c: UnitDetailContent[] = [];
      c.push(s(i.loadState, { class: this.loadClass(i.loadState) }));

      const unitFilePath = i.sourcePath || i.fragmentPath;

      if (i.loadError[0]) {
        c.push(s(`(Reason: ${i.loadError[1]})`));
      }
      else if (unitFilePath && i.unitFileState && !i.unitFilePreset) {
        c.push(
          s(`(${unitFilePath}; `),
          s(i.unitFileState, { class: this.getEnableClass(i.unitFileState) }),
          s(')')
        );
      }
      else if (unitFilePath && i.unitFileState && i.unitFilePreset) {
        c.push(
          s(`(${unitFilePath}; `),
          s(i.unitFileState, { class: this.getEnableClass(i.unitFileState) }),
          s('; preset: '),
          s(i.unitFilePreset, { class: this.getEnableClass(i.unitFilePreset) }),
          s(')')
        );
      }
      else if (unitFilePath) {
        c.push(s(`(${unitFilePath})`));
      }

      l("Loaded", ...c);
    }
    // End Loaded

    if (i.transient) {
      l("Transient", s("yes"));
    }

    // Active and Timestamp
    {
      let c: UnitDetailContent[] = [];
      let ss = i.activeState === i.subState ? "" : ` (${i.subState})`;
      c.push(s(`${i.activeState}${ss}`, { class: this.activeStateToClass(i.activeState) }));

      if (i.freezerState && i.freezerState !== "running") {
        c.push(s(` (${i.freezerState})`, { class: "warning" }));
      }

      if (i.result && i.result !== "success") {
        c.push(s(` (Result: ${i.result})`));
      }

      const ts = this.timestamp(i);
      if (timestampIsSet(ts)) {
        c.push(s(` since ${this.formatService.formatUsecTimestamp(ts)}; ${this.formatService.formatUsecRelativeTimestamp(ts)}`));
      }

      l("Active", ...c);
    }
    // End Active and Timestamp

    // Until
    {
      const until = this.untilTimestamp(i);
      if (timestampIsSet(until)) {
        l("Until",
          s(`${this.formatService.formatUsecTimestamp(until)}; ${this.formatService.formatUsecRelativeTimestamp(until)}`)
        );
      }
    }
    // End Until

    // Duration
    {
      const duration = this.duration(i);
      if (timestampIsSet(duration)) {
        l("Duration",
          s(this.formatService.formatUsecTimespan(duration))
        );
      }
    }
    // End Duration

    // TriggeredBy
    {
      const triggeredBy = this.getUnitsActiveDetails(i.triggeredBy);

      triggeredBy.forEach((el, idx) => {
        let column = idx === 0 ? "TriggeredBy" : "";

        l(column,
          a(el.activeData$.pipe(
            map(activeData => s(activeData.glyph, { class: activeData.class }))
          )),
          s(` ${el.name}`, { link: el.name })
        );
      });
    }
    // End TriggeredBy


    // Trigger
    if (i.id.endsWith(".timer")) {
      const next = this.timerNextElapse(i);
      let formatted = "n/a";

      if (timestampIsSet(next)) {
        formatted = `${this.formatService.formatUsecTimestamp(next)}; ${this.formatService.formatUsecRelativeTimestamp(next)}`;
      }
      l("Trigger", s(formatted));
    }
    // End Trigger

    // Triggers
    {
      const triggers = this.getUnitsActiveDetails(i.triggers);
      triggers.forEach((el, idx) => {
        let column = idx === 0 ? "Triggers" : "";

        l(column,
          a(el.activeData$.pipe(
            map(activeData => s(activeData.glyph, { class: activeData.class }))
          )),
          s(` ${el.name}`, { link: el.name })
        );
      });
    }
    // End Triggers

    // Condition
    if (!i.conditionResult && i.conditionTimestamp) {
      l("Condition",
        s("start"),
        s(" condition unmet", { class: "warning" }),
        s(` at ${this.formatService.formatUsecTimestamp(i.conditionTimestamp)}; ${this.formatService.formatUsecRelativeTimestamp(i.conditionTimestamp)}`)
      );

      if (i.conditions) {
        i.conditions.filter(c => c.tristate < 0).forEach((c, idx, arr) => {
          const isLast = idx === arr.length - 1;
          const trigger = c.trigger ? "|" : "";
          const negate = c.negate ? "!" : "";

          l("",
            s(isLast ? GLYPHS.TREE_RIGHT : GLYPHS.TREE_BRANCH),
            s(` ${c.name}=${trigger}${negate}${c.param} was not met`)
          );
        });
      }
    }
    // End Condition

    // Assert
    if (!i.assertResult && i.assertTimestamp) {
      l("Assert",
        s("start"),
        s(" assertion failed", { class: "error" }),
        s(` at ${this.formatService.formatUsecTimestamp(i.assertTimestamp)}; ${this.formatService.formatUsecRelativeTimestamp(i.assertTimestamp)}`)
      );

      if (i.failedAssertTrigger) {
        l("", s("none of the trigger assertion were met"));
      }
      else if (i.failedAssert) {
        l("", s(`${i.failedAssert}=${i.failedAssertNegate ? "!": ""}${i.failedAssertParameter} was not met`));
      }
    }
    // End Assert

    if (i.sysFsPath) {
      l("Device", s(i.sysFsPath));
    }
    if (i.where) {
      l("Where", s(i.where));
    }
    if (i.what) {
      l("What", s(i.what));
    }

    i.documentation.forEach((doc, idx) => {
      let column = idx === 0 ? "Docs" : "";
      l(column, s(doc));
    });

    i.listen?.forEach((listen, idx) => {
      let column = idx === 0 ? "Listen" : "";
      l(column, s(`${listen.path} (${listen.type})`));
    });

    if (i.accept) {
      const refused = i.nRefused ? ` Refused: ${i.nRefused}` : "";

      l("Accepted", s(`${i.nAccepted}; Connected: ${i.nConnections};${refused}`));
    }

    // EXEC - pominę na razie bo mi się k---a nie chce.

    // Main & Control PID
    if (i.execMainPid) {
      let pidText = `${i.execMainPid}`;
    
      if (i.mainPid) {
        // TODO: ściąganie nazwy procesu
        pidText += ` (<TODO>)`;
      }
      else if (i.exitCode) {
        // TODO: tłumaczenie kodu, status i signal. To raczej od strony backendu muszę zrobić.
        pidText += ` (code=${i.exitCode}, status=${i.exitStatus})`;
        console.log(i);
      }

      if (i.controlPid) {
        pidText += `; Control PID: ${i.controlPid}`;
      }

      l("Main PID", s(pidText));
    }
    else if (i.controlPid) {
      l("Control PID", s(`${i.controlPid}`));
    }
    // End Main & Control PID

    if (i.statusText) {
      l("Status", s(`"${i.statusText}"`, { class: "uwu" }));
    }
    if (i.statusErrno) {
      l("Error", s(`${i.statusErrno}`));
    }

    if (
      i.ipIngressBytes && i.ipIngressBytes < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64 &&
      i.ipEgressBytes && i.ipEgressBytes < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64
    ) {
      l("IP", s(`${this.formatService.formatBytes(i.ipIngressBytes)} in, ${this.formatService.formatBytes(i.ipEgressBytes)} out`));
    }

    if (
      i.ioReadBytes && i.ioReadBytes < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64 &&
      i.ioWriteBytes && i.ioWriteBytes < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64
    ) {
      l("IO", s(`${this.formatService.formatBytes(i.ioReadBytes)} read, ${this.formatService.formatBytes(i.ioWriteBytes)} written`));
    }

    if (i.tasksCurrent && i.tasksCurrent < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
      let limit = "";

      if (i.tasksMax && i.tasksMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
        limit = ` (limit: ${i.tasksMax})`;
      }

      l("Tasks",
        s(`${i.tasksCurrent}${limit}`)
      );
    }

    if (i.nFdStore || i.fdStoreMax) {
      l("FD Store",
        s(`${i.nFdStore ?? 0}`),
        s(` (limit: ${i.fdStoreMax ?? 0})`, { class: "gray" })
      );
    }

    // Memory, oh boy...
    {
      const showMemoryPeak = i.memoryPeak && i.memoryPeak < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64;
      const showMemorySwapPeak = i.memorySwapPeak && i.memorySwapPeak < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64;
      const c: UnitDetailContent[] = [];

      if (i.memoryCurrent && i.memoryCurrent < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
        c.push(s(this.formatService.formatBytes(i.memoryCurrent)));

        const showMemoryZswapCurrent = i.memoryZSwapCurrent && i.memoryZSwapCurrent < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64;
        const showMemoryAvailable = i.memoryAvailable != null && i.memoryAvailable < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64 &&
                                    (
                                      (i.memoryHigh != null && i.memoryHigh < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) ||
                                      (i.memoryMax != null && i.memoryMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64)
                                    ); // My fuck, I will write endpoint in dragon-api that hopefully will simplify all those ifs.
                                       // TODO: rework this clusterfuck after implementing unit details endpoint

        let prefix = " (";

        // Copied this stuff from Chat GPT, I don't have mental to rewrite this clusterfuck by hand.
        if (i.memoryMin) {
          c.push(s(`${prefix}min: ${this.formatService.formatPossiblyInfiniteBytes(i.memoryMin)}`));
          prefix = " ";
        }
        if (i.memoryLow) {
          c.push(s(`${prefix}low: ${this.formatService.formatPossiblyInfiniteBytes(i.memoryLow)}`));
          prefix = " ";
        }
        if (i.startupMemoryLow != null && i.startupMemoryLow > 0) {
          c.push(s(`${prefix}low (startup): ${this.formatService.formatPossiblyInfiniteBytes(i.startupMemoryLow)}`));
          prefix = " ";
        }
        if (i.memoryHigh != null && i.memoryHigh < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}high: ${this.formatService.formatBytes(i.memoryHigh)}`));
          prefix = " ";
        }
        if (i.startupMemoryHigh != null && i.startupMemoryHigh < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}high (startup): ${this.formatService.formatBytes(i.startupMemoryHigh)}`));
          prefix = " ";
        }
        if (i.memoryMax != null && i.memoryMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}max: ${this.formatService.formatBytes(i.memoryMax)}`));
          prefix = " ";
        }
        if (i.startupMemoryMax != null && i.startupMemoryMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}max (startup): ${this.formatService.formatBytes(i.startupMemoryMax)}`));
          prefix = " ";
        }
        if (i.memorySwapMax != null && i.memorySwapMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}swap max: ${this.formatService.formatBytes(i.memorySwapMax)}`));
          prefix = " ";
        }
        if (i.startupMemorySwapMax != null && i.startupMemorySwapMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}swap max (startup): ${this.formatService.formatBytes(i.startupMemorySwapMax)}`));
          prefix = " ";
        }
        if (i.memoryZSwapMax != null && i.memoryZSwapMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}zswap max: ${this.formatService.formatBytes(i.memoryZSwapMax)}`));
          prefix = " ";
        }
        if (i.startupMemoryZSwapMax != null && i.startupMemoryZSwapMax < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}zswap max (startup): ${this.formatService.formatBytes(i.startupMemoryZSwapMax)}`));
          prefix = " ";
        }
        if (i.memoryLimit != null && i.memoryLimit < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
          c.push(s(`${prefix}limit: ${this.formatService.formatBytes(i.memoryLimit)}`));
          prefix = " ";
        }
        if (showMemoryAvailable && i.memoryAvailable != null) {
          c.push(s(`${prefix}available: ${this.formatService.formatBytes(i.memoryAvailable)}`));
          prefix = " ";
        }
        if (showMemoryPeak && i.memoryPeak != null) {
          c.push(s(`${prefix}peak: ${this.formatService.formatBytes(i.memoryPeak)}`));
          prefix = " ";
        }
        if (showMemorySwapPeak && i.memorySwapCurrent != null && i.memorySwapPeak != null) {
          c.push(s(`${prefix}swap: ${this.formatService.formatBytes(i.memorySwapCurrent)} swap peak: ${this.formatService.formatBytes(i.memorySwapPeak)}`));
          prefix = " ";
        }
        if (showMemoryZswapCurrent && i.memoryZSwapCurrent != null) {
          c.push(s(`${prefix}zswap: ${this.formatService.formatBytes(i.memoryZSwapCurrent)}`));
          prefix = " ";
        }

        if (prefix == " ") {
          c.push(s(`)`));
        }
        l("Memory", ...c);
      }
      else if (showMemoryPeak) {
        c.push(s(this.formatService.formatBytes(i.memoryPeak!)));

        if (showMemorySwapPeak) {
          c.push(s(` (swap: ${this.formatService.formatBytes(i.memorySwapPeak!)})`));
        }
        l("Mem peak", ...c);
      }
    }
    // End Memory
    
    if (i.cpuUsageNSec && i.cpuUsageNSec < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
      l("CPU", s(this.formatService.formatUsecTimespan(i.cpuUsageNSec / 1000)));
    }

    if (i.controlGroup) {
      l("CGroup", s(i.controlGroup));
    }

    return ret;
  }

  activeGlyph = computed(() => {
    const active = this.unitInfo()?.activeState;
    if (active) {
      return this.activeStateToGlyph(active);
    }
    return "";
  });

  activeClass = computed(() => {
    const active = this.unitInfo()?.activeState;
    return this.activeStateToClass(active ?? "");
  });

  loadClass(loadState: string) {
    if (loadState && ["error", "not-found", "bad-setting"].includes(loadState)) {
      return "error";
    }
    if (loadState === "loaded") {
      return "success";
    }
    return "";
  };

  timestamp(i: UnitStatusInfo) {
    if (["active", "reloading"].includes(i.activeState)) {
      return i.activeEnterTimestamp;
    }

    if (["inactive", "failed"].includes(i.activeState)) {
      return i.inactiveEnterTimestamp;
    }

    if (i.activeState === "activating") {
      return i.inactiveExitTimestamp;
    }

    return i.activeExitTimestamp;
  }

  untilTimestamp(i: UnitStatusInfo) {
    if (i.activeState != "active" && timestampIsSet(i.runtimeMaxSec)) {
      return this.timestamp(i) + i.runtimeMaxSec;
    }

    return 0;
  }

  duration(i: UnitStatusInfo) {
    if (i.id.endsWith(".target")) {
      return 0;
    }

    if (!["inactive", "failed"].includes(i.activeState)) {
      return 0;
    }

    if (!timestampIsSet(i.activeEnterTimestamp) || !timestampIsSet(i.activeExitTimestamp)) {
      return 0;
    }

    if (i.activeExitTimestamp >= i.activeEnterTimestamp) {
      return i.activeExitTimestamp - i.activeEnterTimestamp;
    }

    return 0;
  }

  getUnitsActiveDetails(unitNames: string[]) {
    return unitNames.map(u => {
      const tActiveData$ = this.activeStateByName(u).pipe(
        map(a => ({
          state: a,
          glyph: this.activeStateToGlyph(a),
          class: this.activeStateToClass(a)
        }))
      );

      return {
        name: u,
        activeData$: tActiveData$
      }
    });
  }

  isEmpty(s: string | undefined | null) {
    if (!s) {
      return true;
    }
    if (!s.trim()) {
      return true;
    }
    return false;
  }

  private handleError(err: any, fatal = false) {
    console.error(err);
    if (fatal) {
      this.error.set(err);
    }
    return null;
  }

  private getEnableClass(enableState: string) {
    switch (enableState) {
      case "enabled": return "success";
      case "disabled": return "warning";
      default: return "";
    }
  }

  private activeStateToGlyph(activeState: string): string {
    switch (activeState) {
      case "active": return GLYPHS.BLACK_CIRCLE;
      case "reloading": return GLYPHS.CIRCLE_ARROW;
      case "inactive": return GLYPHS.WHITE_CIRCLE;
      case "failed": return GLYPHS.MULTIPLICATION_SIGN;
      case "activating": return GLYPHS.BLACK_CIRCLE;
      case "deactivating": return GLYPHS.BLACK_CIRCLE;
      case "maintenance": return GLYPHS.WHITE_CIRCLE;
      default: return "";
    }
  }
  private activeStateToClass(activeState: string): string {
    switch (activeState) {
      case "failed": return "error";

      case "active":
      case "reloading":
        return "success";

      default: return "";
    }
  }
  private activeStateByName(name: string) {
    return this.unitService.getUnitActiveStateByName(name).pipe(
      retry(3),
      catchError(err => {
        this.handleError(err);
        return of("");
      })
    );
  }

  private timerNextElapse(i: UnitStatusInfo) {
    // TODO: powinienem to liczyć z zegara monotonicznego jeżeli jest ustawiony
    // ale że nie mam póki co endpointa pod ściągnięcie automatycznie aktualnego czasu
    // monotonicznego z backendu, to użyję tylko realtime.
    return i.nextElapseReal ?? 0;
  }
}

interface IUnitDetailLine {
  column: string;
  content: UnitDetailContent[];
}

type UnitDetailContent = IUnitDetailContent | IUnitDetailContentAsync;

interface IUnitDetailContent {
  async: false;
  value: string;
  class?: string;
  link?: string;
}
interface IUnitDetailContentAsync {
  value: Observable<IUnitDetailContent>;
  async: true;
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
  @UnitProp("ActiveExitTimestamp") activeExitTimestamp!: number;
  @UnitProp("InactiveEnterTimestamp") inactiveEnterTimestamp!: number;

  @UnitProp("RuntimeMaxSec") runtimeMaxSec!: number;

  @UnitProp("InvocationId") invocationId!: string;

  @UnitProp("NeedDaemonReload") needDaemonReload!: boolean;
  @UnitProp("Transient") transient!: boolean;

  // Service
  @UnitProp("ExecMainPID") execMainPid?: number;
  @UnitProp("MainPID") mainPid?: number;
  @UnitProp("ControlPID") controlPid?: number;
  @UnitProp("StatusText") statusText?: string;
  @UnitProp("PIDFile") pidFile?: string;
  @UnitProp("StatusErrno") statusErrno?: number;

  @UnitProp("FileDescriptorStoreMax") fdStoreMax?: number;
  @UnitProp("NFileDescriptorStore") nFdStore?: number;

  @UnitProp("ExecMainStartTimetamp") startTimestamp?: number;
  @UnitProp("ExecMainExitTimestamp") exitTimestamp?: number;

  @UnitProp("ExecMainCode") exitCode?: number;
  @UnitProp("ExecMainStatus") exitStatus?: number;

  @UnitProp("LogNamespace") logNamespace?: string;

  @UnitProp("ConditionTimestamp") conditionTimestamp?: number;
  @UnitProp("ConditionResult") conditionResult?: boolean;

  // Fields are: name, param, trigger, negate, tristate.
  @UnitProp<[string, boolean, boolean, string, number][], IUnitCondition[]>(
    "Conditions",
    v => v.map(x => ({ name: x[0], trigger: x[1], negate: x[2], param: x[3], tristate: x[4] }))
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
