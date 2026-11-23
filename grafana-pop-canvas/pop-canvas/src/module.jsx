import React, { useEffect, useMemo, useRef } from 'react';
import { getDisplayProcessor, PanelPlugin } from '@grafana/data';
import { TimeSeries, TooltipPlugin, useTheme2 } from '@grafana/ui';

const legend = { showLegend: false };
const container = {
  boxSizing: 'border-box', height: '100%', width: '100%', padding: '5px 7px',
  border: '1px solid', borderRadius: 6, overflow: 'hidden',
  display: 'flex', flexDirection: 'column', gap: 4,
};
const ellipsis = { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' };
const colors = { UP: '#147c27', DOWN: '#c62235', 'N/D': '#515968' };
const valid = (value) => typeof value === 'number' && Number.isFinite(value);
const voltageScales = new Map([
  ['12', { min: 10, max: 13 }],
  ['24', { min: 16, max: 27 }],
  ['42', { min: 26, max: 42 }],
  ['48', { min: 45, max: 55 }],
]);

function failed(data, refId) {
  const errors = [...(data.errors ?? []), ...(data.error ? [data.error] : [])];
  return errors.some((error) => !error.refId || error.refId === refId) ||
    (data.state === 'Error' && errors.length === 0);
}

function series(data, refId) {
  if (failed(data, refId)) {
    return [];
  }
  return data.series.flatMap((frame) => {
    if (frame.refId !== refId) {
      return [];
    }
    const time = frame.fields.find((field) => field.type === 'time');
    const value = frame.fields.find((field) => field.type === 'number');
    return time && value ? [{ frame, time, value }] : [];
  });
}

function useIndicator(data, refId, up, down, popName, timeRange) {
  const previous = useRef();
  const target = data.request?.targets?.find((query) => query.refId === refId);
  const scope = JSON.stringify([popName, target, data.request?.scopedVars, timeRange.raw, up, down]);
  let latest = previous.current?.scope === scope ? previous.current.sample : undefined;
  for (const { time, value } of series(data, refId)) {
    time.values.forEach((timestamp, index) => {
      const reading = value.values[index];
      if (valid(timestamp) && valid(reading) && (reading === up || reading === down) &&
          (!latest || timestamp >= latest.timestamp)) {
        latest = { timestamp, value: reading };
      }
    });
  }
  useEffect(() => {
    previous.current = { scope, sample: latest };
  }, [scope, latest]);
  if (!latest || up === down) {
    return 'N/D';
  }
  return latest.value === up ? 'UP' : 'DOWN';
}

function Indicator({ label, status }) {
  return (
    <div style={{ minWidth: 0, textAlign: 'center' }}>
      <div aria-label={label + ' ' + status} style={{
        display: 'inline-grid', placeItems: 'center', minWidth: 42, height: 25,
        padding: '0 5px', borderRadius: 4, color: '#fff', background: colors[status],
        fontSize: 12, fontWeight: 750,
      }}>{status}</div>
      <div title={label} style={{ ...ellipsis, fontSize: 11, lineHeight: '15px' }}>{label}</div>
    </div>
  );
}

function history(data, timeRange, options, theme, timeZone) {
  const entry = series(data, 'C')[0];
  if (!entry) {
    return {};
  }
  const from = timeRange.from.valueOf();
  const to = timeRange.to.valueOf();
  const step = entry.time.config.interval ?? data.request?.intervalMs ?? 0;
  const gap = Math.max(options.gapSeconds * 1000, step * 1.5);
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
      if (prev !== undefined && timestamp - prev > gap) {
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
  const normalColor = options.batteryNormalColor || '#68d851';
  const lowColor = options.batteryLowColor || '#e02f44';
  const frame = {
    name: options.chartTitle, refId: 'C', length: times.length,
    fields: [
      { name: 'Time', type: 'time', config: {}, values: times },
      { name: options.chartTitle, type: 'number', values, config: {
        unit: options.unit ? 'suffix: ' + options.unit : 'none',
        decimals: options.decimals,
        color: hasLimit ? { mode: 'thresholds' } : { mode: 'fixed', fixedColor: normalColor },
        ...(hasLimit && { thresholds: { mode: 'absolute', steps: [
          { value: -Infinity, color: lowColor },
          { value: options.batteryLimit, color: normalColor },
        ] } }),
        custom: {
          ...(scale && { axisSoftMin: scale.min, axisSoftMax: scale.max }),
          ...(hasLimit && { gradientMode: 'scheme' }),
          lineWidth: 1.5, fillOpacity: 14, drawStyle: 'line',
          showPoints: 'auto', spanNulls: false, axisBorderShow: false,
        },
      } },
    ],
  };
  for (const field of frame.fields) {
    field.display = getDisplayProcessor({ field, theme, timeZone });
  }
  const lastColor = hasLimit && valid(last)
    ? theme.visualization.getColorByName(last < options.batteryLimit ? lowColor : normalColor)
    : undefined;
  return { frame, last, lastColor };
}

function Panel({ options, title, data, width, height, timeRange, timeZone }) {
  const theme = useTheme2();
  const statusA = useIndicator(data, 'A', options.upA, options.downA, options.popName, timeRange);
  const statusB = useIndicator(data, 'B', options.upB, options.downB, options.popName, timeRange);

  const { frame, last, lastColor } = useMemo(
    () => history(data, timeRange, options, theme, timeZone),
    [data, timeRange, options, theme, timeZone]
  );
  const frames = useMemo(() => frame ? [frame] : [], [frame]);
  const latest = valid(last) ? new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: options.decimals, minimumFractionDigits: options.decimals,
  }).format(last) + (options.unit ? ' ' + options.unit : '') : null;
  const name = options.popName || title || 'POP Canvas';
  return (
    <article aria-label={name} style={{
      ...container, color: theme.colors.text.primary, background: theme.colors.background.secondary,
      borderColor: theme.colors.border.medium,
    }}>
      <div title={name} style={{ ...ellipsis, flexShrink: 0, lineHeight: '17px', fontWeight: 750 }}>{name}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 4, flexShrink: 0 }}>
        <Indicator label={options.labelA} status={statusA} />
        <Indicator label={options.labelB} status={statusB} />
      </div>
      <div style={{
        minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column',
        borderTop: '1px solid ' + theme.colors.border.weak,
      }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between', lineHeight: '18px', fontSize: 11 }}>
          <span title={options.chartTitle} style={ellipsis}>{options.chartTitle}</span>
          {latest && <strong aria-label={'Último valor ' + latest} style={{ whiteSpace: 'nowrap', color: lastColor }}>{latest}</strong>}
        </div>
        {latest ? (
          <div aria-label={options.chartTitle} tabIndex={0}>
            <TimeSeries frames={frames} width={Math.max(60, width - 16)} height={Math.max(24, height - 104)}
              timeRange={timeRange} timeZone={timeZone} legend={legend}>
              {(config, alignedFrame) => (
                <TooltipPlugin config={config} data={alignedFrame} frames={frames} timeZone={timeZone} />
              )}
            </TimeSeries>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', fontSize: 11, color: theme.colors.text.secondary }}>
            Sem histórico
          </div>
        )}
      </div>
    </article>
  );
}

export const plugin = new PanelPlugin(Panel).setPanelOptions((builder) => builder
  .addTextInput({ path: 'popName', name: 'Nome do POP', defaultValue: '' })
  .addTextInput({ path: 'labelA', name: 'Nome do indicador A', defaultValue: 'Roteador' })
  .addNumberInput({ path: 'upA', name: 'Valor UP para A', defaultValue: 1 })
  .addNumberInput({ path: 'downA', name: 'Valor DOWN para A', defaultValue: 0 })
  .addTextInput({ path: 'labelB', name: 'Nome do indicador B', defaultValue: 'Energia' })
  .addNumberInput({ path: 'upB', name: 'Valor UP para B', defaultValue: 1 })
  .addNumberInput({ path: 'downB', name: 'Valor DOWN para B', defaultValue: 0 })
  .addTextInput({ path: 'chartTitle', name: 'Título do gráfico C', defaultValue: 'Tensão do banco' })
  .addTextInput({ path: 'unit', name: 'Unidade do gráfico C', defaultValue: 'V' })
  .addSelect({
    path: 'bankVoltage', name: 'Tensão nominal do banco', defaultValue: 'auto',
    description: 'Define a escala visual do gráfico. Leituras fora da faixa ampliam o eixo.',
    settings: { options: [
      { value: 'auto', label: 'Automática' },
      ...Array.from(voltageScales, ([value, { min, max }]) => ({ value, label: value + ' V (escala de ' + min + ' a ' + max + ' V)' })),
    ] },
  })
  .addNumberInput({ path: 'batteryLimit', name: 'Banco de baterias abaixo de', description: 'Na unidade do gráfico. Deixe em branco para desativar o limite.', settings: { step: 0.1 } })
  .addColorPicker({ path: 'batteryLowColor', name: 'Cor abaixo do limite', defaultValue: '#e02f44' })
  .addColorPicker({ path: 'batteryNormalColor', name: 'Cor padrão do banco', defaultValue: '#68d851' })
  .addNumberInput({ path: 'decimals', name: 'Casas decimais', defaultValue: 1, settings: { min: 0, max: 8 } })
  .addNumberInput({ path: 'gapSeconds', name: 'Lacuna no gráfico após segundos sem amostra', defaultValue: 22.5,
    settings: { min: 1, max: 86400 } }));
