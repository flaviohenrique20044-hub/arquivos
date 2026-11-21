System.register(["react","@grafana/data","@grafana/ui"], function (publish) {
  const modules = Object.create(null);
  return {
    setters: ["react","@grafana/data","@grafana/ui"].map(name => value => { modules[name] = value; }),
    execute: function () {
      const module = { exports: {} };
      const exports = module.exports;
      function require(name) { return modules[name]; }
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// outputs/pop-lab/pop-canvas/src/module.jsx
var module_exports = {};
__export(module_exports, {
  plugin: () => plugin
});
module.exports = __toCommonJS(module_exports);
var import_react = __toESM(require("react"));
var import_data = require("@grafana/data");
var import_ui = require("@grafana/ui");
var legend = { showLegend: false };
var container = {
  boxSizing: "border-box",
  height: "100%",
  width: "100%",
  padding: "5px 7px",
  border: "1px solid",
  borderRadius: 6,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 4
};
var ellipsis = { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" };
var colors = { UP: "#147c27", DOWN: "#c62235", "N/D": "#515968" };
var valid = (value) => typeof value === "number" && Number.isFinite(value);
function failed(data, refId) {
  const errors = [...data.errors ?? [], ...data.error ? [data.error] : []];
  return errors.some((error) => !error.refId || error.refId === refId) || data.state === "Error" && errors.length === 0;
}
function series(data, refId) {
  if (failed(data, refId)) {
    return [];
  }
  return data.series.flatMap((frame) => {
    if (frame.refId !== refId) {
      return [];
    }
    const time = frame.fields.find((field) => field.type === "time");
    const value = frame.fields.find((field) => field.type === "number");
    return time && value ? [{ frame, time, value }] : [];
  });
}
function newest(data, refId) {
  let latest;
  for (const { time, value } of series(data, refId)) {
    time.values.forEach((timestamp, index) => {
      if (valid(timestamp) && (!latest || timestamp > latest.timestamp)) {
        latest = { timestamp, value: value.values[index] };
      }
    });
  }
  return latest;
}
function state(sample, now, validityMs, up, down) {
  if (!sample || !valid(sample.value) || now - sample.timestamp >= validityMs || up === down) {
    return "N/D";
  }
  if (sample.value === up) {
    return "UP";
  }
  return sample.value === down ? "DOWN" : "N/D";
}
function Indicator({ label, status }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { style: { minWidth: 0, textAlign: "center" } }, /* @__PURE__ */ import_react.default.createElement("div", { "aria-label": label + " " + status, style: {
    display: "inline-grid",
    placeItems: "center",
    minWidth: 42,
    height: 25,
    padding: "0 5px",
    borderRadius: 4,
    color: "#fff",
    background: colors[status],
    fontSize: 12,
    fontWeight: 750
  } }, status), /* @__PURE__ */ import_react.default.createElement("div", { title: label, style: { ...ellipsis, fontSize: 11, lineHeight: "15px" } }, label));
}
function history(data, timeRange, options, theme, timeZone) {
  const entry = series(data, "C")[0];
  if (!entry) {
    return {};
  }
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();
  const step = entry.time.config.interval ?? data.request?.intervalMs ?? 0;
  const gap = Math.max(options.gapSeconds * 1e3, step * 1.5);
  const points = entry.time.values.flatMap((timestamp, index) => {
    if (!valid(timestamp) || timestamp < from || timestamp > to) {
      return [];
    }
    const value = entry.value.values[index];
    return [[timestamp, valid(value) ? value : null]];
  }).sort((a, b) => a[0] - b[0]);
  const times = [];
  const values = [];
  let last;
  for (const [timestamp, value] of points) {
    const prev = times.at(-1);
    if (timestamp === prev) {
      values[values.length - 1] = value;
    } else {
      if (prev !== void 0 && timestamp - prev > gap) {
        times.push(prev + (timestamp - prev) / 2);
        values.push(null);
      }
      times.push(timestamp);
      values.push(value);
    }
  }
  for (let index = values.length - 1; index >= 0; index--) {
    if (valid(values[index])) {
      last = values[index];
      break;
    }
  }
  const frame = {
    name: options.chartTitle,
    refId: "C",
    length: times.length,
    fields: [
      { name: "Time", type: "time", config: {}, values: times },
      { name: options.chartTitle, type: "number", values, config: {
        unit: options.unit ? "suffix: " + options.unit : "none",
        decimals: options.decimals,
        color: { mode: "fixed", fixedColor: "#68d851" },
        custom: {
          lineWidth: 1.5,
          fillOpacity: 14,
          drawStyle: "line",
          showPoints: "auto",
          spanNulls: false,
          axisBorderShow: false
        }
      } }
    ]
  };
  for (const field of frame.fields) {
    field.display = (0, import_data.getDisplayProcessor)({ field, theme, timeZone });
  }
  return { frame, last };
}
function Panel({ options, title, data, width, height, timeRange, timeZone }) {
  const theme = (0, import_ui.useTheme2)();
  const a = newest(data, "A");
  const b = newest(data, "B");
  const validityMs = (options.validitySeconds ?? 45) * 1e3;
  const [, expire] = (0, import_react.useState)(0);
  const now = Date.now();
  const statusA = state(a, now, validityMs, options.upA, options.downA);
  const statusB = state(b, now, validityMs, options.upB, options.downB);
  (0, import_react.useEffect)(() => {
    const current = Date.now();
    const deadlines = [a?.timestamp, b?.timestamp].filter(valid).map((timestamp) => timestamp + validityMs).filter((deadline) => deadline > current);
    if (!deadlines.length) {
      return;
    }
    const timer = setTimeout(() => expire((value) => value + 1), Math.min(...deadlines) - current + 20);
    return () => clearTimeout(timer);
  }, [a?.timestamp, b?.timestamp, validityMs, statusA, statusB]);
  const { frame, last } = (0, import_react.useMemo)(
    () => history(data, timeRange, options, theme, timeZone),
    [data, timeRange, options, theme, timeZone]
  );
  const frames = (0, import_react.useMemo)(() => frame ? [frame] : [], [frame]);
  const latest = valid(last) ? new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: options.decimals,
    minimumFractionDigits: options.decimals
  }).format(last) + (options.unit ? " " + options.unit : "") : null;
  const name = options.popName || title || "POP Canvas";
  return /* @__PURE__ */ import_react.default.createElement("article", { "aria-label": name, style: {
    ...container,
    color: theme.colors.text.primary,
    background: theme.colors.background.secondary,
    borderColor: theme.colors.border.medium
  } }, /* @__PURE__ */ import_react.default.createElement("div", { title: name, style: { ...ellipsis, flexShrink: 0, lineHeight: "17px", fontWeight: 750 } }, name), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 4, flexShrink: 0 } }, /* @__PURE__ */ import_react.default.createElement(Indicator, { label: options.labelA, status: statusA }), /* @__PURE__ */ import_react.default.createElement(Indicator, { label: options.labelB, status: statusB })), /* @__PURE__ */ import_react.default.createElement("div", { style: {
    minHeight: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid " + theme.colors.border.weak
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", gap: 5, justifyContent: "space-between", lineHeight: "18px", fontSize: 11 } }, /* @__PURE__ */ import_react.default.createElement("span", { title: options.chartTitle, style: ellipsis }, options.chartTitle), latest && /* @__PURE__ */ import_react.default.createElement("strong", { "aria-label": "\xDAltimo valor " + latest, style: { whiteSpace: "nowrap" } }, latest)), latest ? /* @__PURE__ */ import_react.default.createElement("div", { "aria-label": options.chartTitle, tabIndex: 0 }, /* @__PURE__ */ import_react.default.createElement(
    import_ui.TimeSeries,
    {
      frames,
      width: Math.max(60, width - 16),
      height: Math.max(24, height - 104),
      timeRange,
      timeZone,
      legend
    },
    (config, alignedFrame) => /* @__PURE__ */ import_react.default.createElement(import_ui.TooltipPlugin, { config, data: alignedFrame, frames, timeZone })
  )) : /* @__PURE__ */ import_react.default.createElement("div", { style: { flex: 1, display: "grid", placeItems: "center", fontSize: 11, color: theme.colors.text.secondary } }, "Sem hist\xF3rico")));
}
var plugin = new import_data.PanelPlugin(Panel).setPanelOptions((builder) => builder.addTextInput({ path: "popName", name: "Nome do POP", defaultValue: "" }).addTextInput({ path: "labelA", name: "Nome do indicador A", defaultValue: "Roteador" }).addNumberInput({ path: "upA", name: "Valor UP para A", defaultValue: 1 }).addNumberInput({ path: "downA", name: "Valor DOWN para A", defaultValue: 0 }).addTextInput({ path: "labelB", name: "Nome do indicador B", defaultValue: "Energia" }).addNumberInput({ path: "upB", name: "Valor UP para B", defaultValue: 1 }).addNumberInput({ path: "downB", name: "Valor DOWN para B", defaultValue: 0 }).addNumberInput({
  path: "validitySeconds",
  name: "Validade dos indicadores em segundos",
  defaultValue: 45,
  settings: { min: 1, max: 86400 }
}).addTextInput({ path: "chartTitle", name: "T\xEDtulo do gr\xE1fico C", defaultValue: "Tens\xE3o do banco" }).addTextInput({ path: "unit", name: "Unidade do gr\xE1fico C", defaultValue: "V" }).addNumberInput({ path: "decimals", name: "Casas decimais", defaultValue: 1, settings: { min: 0, max: 8 } }).addNumberInput({
  path: "gapSeconds",
  name: "Lacuna no gr\xE1fico ap\xF3s segundos sem amostra",
  defaultValue: 22.5,
  settings: { min: 1, max: 86400 }
}));

      publish('plugin', module.exports.plugin);
    }
  };
});
