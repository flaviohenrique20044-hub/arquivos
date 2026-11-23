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

// pop-canvas/src/module.jsx
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
var voltageScales = /* @__PURE__ */ new Map([
  ["12", { min: 10, max: 13 }],
  ["24", { min: 16, max: 27 }],
  ["42", { min: 26, max: 42 }],
  ["48", { min: 45, max: 55 }]
]);
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
function useIndicator(data, refId, up, down, popName, timeRange) {
  const previous = (0, import_react.useRef)();
  const target = data.request?.targets?.find((query) => query.refId === refId);
  const scope = JSON.stringify([popName, target, data.request?.scopedVars, timeRange.raw, up, down]);
  let latest = previous.current?.scope === scope ? previous.current.sample : void 0;
  for (const { time, value } of series(data, refId)) {
    time.values.forEach((timestamp, index) => {
      const reading = value.values[index];
      if (valid(timestamp) && valid(reading) && (reading === up || reading === down) && (!latest || timestamp >= latest.timestamp)) {
        latest = { timestamp, value: reading };
      }
    });
  }
  (0, import_react.useEffect)(() => {
    previous.current = { scope, sample: latest };
  }, [scope, latest]);
  if (!latest || up === down) {
    return "N/D";
  }
  return latest.value === up ? "UP" : "DOWN";
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
  const hasLimit = valid(options.batteryLimit);
  const scale = voltageScales.get(options.bankVoltage);
  const normalColor = options.batteryNormalColor || "#68d851";
  const lowColor = options.batteryLowColor || "#e02f44";
  const frame = {
    name: options.chartTitle,
    refId: "C",
    length: times.length,
    fields: [
      { name: "Time", type: "time", config: {}, values: times },
      { name: options.chartTitle, type: "number", values, config: {
        unit: options.unit ? "suffix: " + options.unit : "none",
        decimals: options.decimals,
        color: hasLimit ? { mode: "thresholds" } : { mode: "fixed", fixedColor: normalColor },
        ...hasLimit && { thresholds: { mode: "absolute", steps: [
          { value: -Infinity, color: lowColor },
          { value: options.batteryLimit, color: normalColor }
        ] } },
        custom: {
          ...scale && { axisSoftMin: scale.min, axisSoftMax: scale.max },
          ...hasLimit && { gradientMode: "scheme" },
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
  const lastColor = hasLimit && valid(last) ? theme.visualization.getColorByName(last < options.batteryLimit ? lowColor : normalColor) : void 0;
  return { frame, last, lastColor };
}
function Panel({ options, title, data, width, height, timeRange, timeZone }) {
  const theme = (0, import_ui.useTheme2)();
  const statusA = useIndicator(data, "A", options.upA, options.downA, options.popName, timeRange);
  const statusB = useIndicator(data, "B", options.upB, options.downB, options.popName, timeRange);
  const { frame, last, lastColor } = (0, import_react.useMemo)(
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
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", gap: 5, justifyContent: "space-between", lineHeight: "18px", fontSize: 11 } }, /* @__PURE__ */ import_react.default.createElement("span", { title: options.chartTitle, style: ellipsis }, options.chartTitle), latest && /* @__PURE__ */ import_react.default.createElement("strong", { "aria-label": "\xDAltimo valor " + latest, style: { whiteSpace: "nowrap", color: lastColor } }, latest)), latest ? /* @__PURE__ */ import_react.default.createElement("div", { "aria-label": options.chartTitle, tabIndex: 0 }, /* @__PURE__ */ import_react.default.createElement(
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
var plugin = new import_data.PanelPlugin(Panel).setPanelOptions((builder) => builder.addTextInput({ path: "popName", name: "Nome do POP", defaultValue: "" }).addTextInput({ path: "labelA", name: "Nome do indicador A", defaultValue: "Roteador" }).addNumberInput({ path: "upA", name: "Valor UP para A", defaultValue: 1 }).addNumberInput({ path: "downA", name: "Valor DOWN para A", defaultValue: 0 }).addTextInput({ path: "labelB", name: "Nome do indicador B", defaultValue: "Energia" }).addNumberInput({ path: "upB", name: "Valor UP para B", defaultValue: 1 }).addNumberInput({ path: "downB", name: "Valor DOWN para B", defaultValue: 0 }).addTextInput({ path: "chartTitle", name: "T\xEDtulo do gr\xE1fico C", defaultValue: "Tens\xE3o do banco" }).addTextInput({ path: "unit", name: "Unidade do gr\xE1fico C", defaultValue: "V" }).addSelect({
  path: "bankVoltage",
  name: "Tens\xE3o nominal do banco",
  defaultValue: "auto",
  description: "Define a escala visual do gr\xE1fico. Leituras fora da faixa ampliam o eixo.",
  settings: { options: [
    { value: "auto", label: "Autom\xE1tica" },
    ...Array.from(voltageScales, ([value, { min, max }]) => ({ value, label: value + " V (escala de " + min + " a " + max + " V)" }))
  ] }
}).addNumberInput({ path: "batteryLimit", name: "Banco de baterias abaixo de", description: "Na unidade do gr\xE1fico. Deixe em branco para desativar o limite.", settings: { step: 0.1 } }).addColorPicker({ path: "batteryLowColor", name: "Cor abaixo do limite", defaultValue: "#e02f44" }).addColorPicker({ path: "batteryNormalColor", name: "Cor padr\xE3o do banco", defaultValue: "#68d851" }).addNumberInput({ path: "decimals", name: "Casas decimais", defaultValue: 1, settings: { min: 0, max: 8 } }).addNumberInput({
  path: "gapSeconds",
  name: "Lacuna no gr\xE1fico ap\xF3s segundos sem amostra",
  defaultValue: 22.5,
  settings: { min: 1, max: 86400 }
}));

      publish('plugin', module.exports.plugin);
    }
  };
});
