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
var rowHeight = 18;
var gap = 2;
var paddingY = 3;
var paddingX = 5;
var container = {
  boxSizing: "border-box",
  height: "100%",
  width: "100%",
  padding: `${paddingY}px ${paddingX}px`,
  border: "1px solid",
  borderRadius: 6,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap
};
var ellipsis = { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" };
var colors = { UP: "#147c27", DOWN: "#c62235", "N/D": "#515968", "N\xE3o instalado": "#245caa" };
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
function series(data, refId, allowText = false) {
  if (failed(data, refId)) {
    return [];
  }
  return data.series.flatMap((frame) => {
    if (frame.refId !== refId) {
      return [];
    }
    const time = frame.fields.find((field) => field.type === "time");
    const value = frame.fields.find((field) => field.type === "number") ??
      (allowText && frame.fields.find((field) => field.type === 'string'));
    return time && value ? [{ frame, time, value }] : [];
  });
}
const retainedSamples = new Map();

function useRetainedSample(panelKey, channel, sample, source) {
  const key = JSON.stringify([panelKey, channel]);
  const previous = retainedSamples.get(key);
  const sameSource = source === undefined || source === previous?.source;
  const priorSample = previous?.sample;
  const latest = sample && (!priorSample || !sameSource || sample.timestamp >= priorSample.timestamp) ? sample : priorSample;
  const activeSource = sample ? source ?? previous?.source : previous?.source;
  (0, import_react.useEffect)(() => {
    if (latest || activeSource !== undefined) {
      retainedSamples.set(key, { source: activeSource, sample: latest });
    }
  }, [key, latest, activeSource]);
  return latest;
}

function sensorIdentity(target) {
  if (!target) return undefined;
  const { datasource, group, host, application, item, itemid, itemids, query } = target;
  if (![item, itemid, itemids, query].some(value => value != null && value !== "")) return undefined;
  return JSON.stringify([datasource?.uid ?? datasource, group, host, application, item, itemid, itemids, query]);
}

function useIndicator(data, refId, up, down, panelKey) {
  const target = data.request?.targets?.find((query) => query.refId === refId);
  const source = sensorIdentity(target);
  let sample;
  for (const { time, value } of series(data, refId, true)) {
    time.values.forEach((timestamp, index) => {
      const raw = value.values[index];
      const reading = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
      if (valid(timestamp) && valid(reading) && (reading === up || reading === down) &&
          (!sample || timestamp >= sample.timestamp)) {
        sample = { timestamp, value: reading };
      }
    });
  }
  const latest = useRetainedSample(panelKey, [refId, up, down], data.state === "Loading" ? undefined : sample, source);
  return !latest || up === down ? 'N/D' : latest.value === up ? 'UP' : 'DOWN';
}

function Indicator({ label, status }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { title: label + " \xB7 " + status, "aria-label": label + " " + status, style: {
    ...ellipsis,
    minWidth: 0,
    textAlign: "center",
    lineHeight: rowHeight + "px",
    padding: "0 4px",
    color: "#fff",
    background: colors[status],
    fontSize: 15,
    fontWeight: 700
  } }, label);
}
function history(data, timeRange, options, theme, timeZone) {
  const entry = series(data, "C")[0];
  if (!entry) {
    return undefined;
  }
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();
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
  let lastTime;
  for (const [timestamp, value] of points) {
    const prev = times.at(-1);
    if (timestamp === prev) {
      values[values.length - 1] = value;
    } else {
      times.push(timestamp);
      values.push(value);
    }
  }
  for (let index = values.length - 1; index >= 0; index--) {
    if (valid(values[index])) {
      last = values[index];
      lastTime = times[index];
      break;
    }
  }
  const hasLimit = valid(options.batteryLimit);
  const scale = voltageScales.get(options.bankVoltage);
  const normalColor = options.batteryNormalColor || "#68d851";
  const lowColor = options.batteryLowColor || "#e02f44";
  const chartColor = hasLimit && valid(last) && last < options.batteryLimit ? lowColor : normalColor;
  const frame = {
    name: options.chartTitle,
    refId: "C",
    length: times.length,
    fields: [
      { name: "Time", type: "time", config: { custom: { axisPlacement: "hidden", axisGridShow: false } }, values: times },
      { name: options.chartTitle, type: "number", values, config: {
        unit: options.unit ? "suffix: " + options.unit : "none",
        decimals: options.decimals,
        color: { mode: "fixed", fixedColor: chartColor },
        custom: {
          ...scale && { axisSoftMin: scale.min, axisSoftMax: scale.max },
          axisPlacement: "hidden",
          axisGridShow: false,
          lineWidth: 2,
          fillOpacity: 14,
          drawStyle: "line",
          showPoints: "auto",
          spanNulls: true,
          axisBorderShow: false
        }
      } }
    ]
  };
  for (const field of frame.fields) {
    field.display = (0, import_data.getDisplayProcessor)({ field, theme, timeZone });
  }
  const lastColor = hasLimit && valid(last) ? theme.visualization.getColorByName(chartColor) : void 0;
  return valid(last) ? { frame, last, lastColor, timestamp: lastTime, timeRange } : undefined;
}
function latestTemperature(data, timeRange) {
  let latestTime = -Infinity;
  let temperature;
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();
  for (const { time, value } of series(data, "D")) {
    time.values.forEach((timestamp, index) => {
      const reading = value.values[index];
      if (valid(timestamp) && timestamp >= from && timestamp <= to && timestamp >= latestTime && valid(reading)) {
        latestTime = timestamp;
        temperature = reading;
      }
    });
  }
  return valid(temperature) ? { timestamp: latestTime, value: temperature } : undefined;
}
function Panel({ id, options, title, data, width, height, timeRange, timeZone }) {
  const theme = (0, import_ui.useTheme2)();
  const variables = Array.from(new URLSearchParams(window.location.search)).filter(([name]) => name.startsWith("var-"));
  const panelKey = JSON.stringify([window.location.pathname, variables, id, options.popName || title, timeRange.raw?.from, timeRange.raw?.to]);
  const showRouter = options.popHasRouter !== false;
  const statusA = useIndicator(data, "A", options.upA, options.downA, panelKey);
  const statusB = useIndicator(data, "B", options.upB, options.downB, panelKey);
  const currentHistory = (0, import_react.useMemo)(
    () => history(data, timeRange, options, theme, timeZone),
    [data, timeRange, options, theme, timeZone]
  );
  const retainedHistory = useRetainedSample(panelKey, "C", currentHistory);
  const { frame, last, lastColor } = retainedHistory || {};
  const frames = (0, import_react.useMemo)(() => frame ? [frame] : [], [frame]);
  const latest = valid(last) ? new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: options.decimals,
    minimumFractionDigits: options.decimals
  }).format(last) + (options.unit ? " " + options.unit : "") : null;
  const name = options.popName || title || "POP Canvas";
  const currentTemperature = (0, import_react.useMemo)(() => latestTemperature(data, timeRange), [data, timeRange]);
  const temperature = useRetainedSample(panelKey, "D", currentTemperature)?.value;
  const temperatureSymbol = options.externalTemperature ? "≋" : "▣";
  const temperatureSource = options.externalTemperature ? "Temperatura ambiente do POP" : "Temperatura interna do equipamento";
  const temperatureText = valid(temperature) ? temperatureSymbol + " " + temperature.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " \xB0C" : "";
  return /* @__PURE__ */ import_react.default.createElement("article", { "aria-label": name, style: {
    ...container,
    color: theme.colors.text.primary,
    background: theme.colors.background.secondary,
    borderColor: theme.colors.border.medium
  } }, /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "grid", alignItems: "center", gridTemplateColumns: temperatureText ? "min(32%, 76px) minmax(0, 1fr) min(32%, 76px)" : "1fr", height: rowHeight, flexShrink: 0 } }, /* @__PURE__ */ import_react.default.createElement("strong", { title: name, style: { ...ellipsis, gridColumn: temperatureText ? 2 : 1, textAlign: "center", fontSize: 15 } }, name), temperatureText && /* @__PURE__ */ import_react.default.createElement("strong", { title: temperatureSource + " · " + temperatureText, style: {
    ...ellipsis,
    textAlign: "right",
    fontSize: 13
  } }, temperatureText)), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "grid", gridTemplateColumns: showRouter ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)", gap: 0, borderRadius: 3, overflow: "hidden", height: rowHeight, flexShrink: 0 } }, showRouter && /* @__PURE__ */ import_react.default.createElement(Indicator, { label: options.labelA, status: options.routerInstalled === false ? "N\xE3o instalado" : statusA }), /* @__PURE__ */ import_react.default.createElement(Indicator, { label: options.labelB, status: statusB })), /* @__PURE__ */ import_react.default.createElement("div", { style: { minHeight: 0, flex: 1, display: "flex", flexDirection: "column" } }, latest ? /* @__PURE__ */ import_react.default.createElement("div", { "aria-label": options.chartTitle, tabIndex: 0, style: { position: "relative", flex: 1, minHeight: 0 } }, /* @__PURE__ */ import_react.default.createElement(
    import_ui.TimeSeries,
    {
      frames,
      width: Math.max(1, width - 2 * (paddingX + 1)),
      height: Math.max(1, height - 2 * (rowHeight + gap + paddingY + 1)),
      timeRange: retainedHistory.timeRange,
      timeZone,
      legend
    },
    (config, alignedFrame) => /* @__PURE__ */ import_react.default.createElement(import_ui.TooltipPlugin, { config, data: alignedFrame, frames, timeZone })
  ), /* @__PURE__ */ import_react.default.createElement("strong", { "aria-label": "\xDAltimo valor " + latest, style: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    fontSize: 16,
    lineHeight: 1.1,
    color: lastColor,
    textShadow: "0 0 3px " + theme.colors.background.secondary
  } }, latest)) : /* @__PURE__ */ import_react.default.createElement("div", { style: { flex: 1, display: "grid", placeItems: "center", fontSize: 11, color: theme.colors.text.secondary } }, "Sem hist\xF3rico")));
}
var plugin = new import_data.PanelPlugin(Panel).setPanelOptions((builder) => builder.addTextInput({ path: "popName", name: "Nome do POP", defaultValue: "" }).addTextInput({ path: "labelA", name: "Nome do indicador A", defaultValue: "Roteador" }).addBooleanSwitch({ path: "popHasRouter", name: "POP vai possuir roteador?", defaultValue: true }).addBooleanSwitch({ path: "routerInstalled", name: "Roteador do POP adicionado?", defaultValue: true }).addNumberInput({ path: "upA", name: "Valor UP para A", defaultValue: 1 }).addNumberInput({ path: "downA", name: "Valor DOWN para A", defaultValue: 0 }).addTextInput({ path: "labelB", name: "Nome do indicador B", defaultValue: "Energia" }).addNumberInput({ path: "upB", name: "Valor UP para B", defaultValue: 1 }).addNumberInput({ path: "downB", name: "Valor DOWN para B", defaultValue: 0 }).addTextInput({ path: "chartTitle", name: "T\xEDtulo do gr\xE1fico C", defaultValue: "Tens\xE3o do banco" }).addTextInput({ path: "unit", name: "Unidade do gr\xE1fico C", defaultValue: "V" }).addSelect({
  path: "bankVoltage",
  name: "Tens\xE3o nominal do banco",
  defaultValue: "auto",
  description: "Define a escala visual do gr\xE1fico. Leituras fora da faixa ampliam o eixo.",
  settings: { options: [
    { value: "auto", label: "Autom\xE1tica" },
    ...Array.from(voltageScales, ([value, { min, max }]) => ({ value, label: value + " V (escala de " + min + " a " + max + " V)" }))
  ] }
}).addNumberInput({ path: "batteryLimit", name: "Banco de baterias abaixo de", description: "Na unidade do gr\xE1fico. Deixe em branco para desativar o limite.", settings: { step: 0.1 } }).addColorPicker({ path: "batteryLowColor", name: "Cor abaixo do limite", defaultValue: "#e02f44" }).addColorPicker({ path: "batteryNormalColor", name: "Cor padr\xE3o do banco", defaultValue: "#68d851" }).addNumberInput({ path: "decimals", name: "Casas decimais", defaultValue: 1, settings: { min: 0, max: 8 } }).addBooleanSwitch({ path: "externalTemperature", name: "POP possui monitoramento de temperatura externa?", description: "Marque se um sensor independente mede a temperatura do ambiente do POP (≋). Desmarque se a leitura vem do sensor interno de um equipamento (▣).", defaultValue: false }));

      publish('plugin', module.exports.plugin);
    }
  };
});
