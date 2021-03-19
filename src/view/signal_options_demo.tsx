import * as React from 'react'
import { DynamicsCompressorOptions, OscillatorOptions, useAudioSignal } from '../utils/audio'
import { removeFloatArtifact } from '../utils/number'
import LoadingScreen from './loading_screen/loading_screen'
import Layout from './layout/layout'
import Chart from './chart/chart'
import Form from './form/form'
import Range from './form/range'
import Select from './form/select'
import SectionHeader from './form/section_header'
import { palette } from './style'

interface Props {
  useDynamicsCompressor?: boolean
}

const SignalOptionsDemo = React.memo(function SignalOptionsDemo({ useDynamicsCompressor }: Props) {
  const signalOffset = useDynamicsCompressor ? 250 : 0
  const [formData, setFormData] = React.useState<FormData>({
    oscillator: {
      type: useDynamicsCompressor ? 'square' : 'sine',
      frequency: 170,
    },
    dynamicsCompressor: {
      threshold: -50,
      knee: 40,
      ratio: 12,
      attack: 0.012,
      release: 0.25,
    },
  })
  const signal = useAudioSignal({
    length: 2500,
    oscillator: formData.oscillator,
    dynamicsCompressor: useDynamicsCompressor ? formData.dynamicsCompressor : undefined,
  })
  // This useMemo is required for the Chart inner memoization
  const chartLines = React.useMemo(
    () => [
      {
        name: 'Audio signal',
        color: palette[0],
        values: signal?.subarray(signalOffset) ?? [],
        draw: true,
        showInPopup: true,
      },
    ],
    [signal || undefined, signalOffset],
  )

  if (signal === undefined) {
    return <LoadingScreen fullAbsolute />
  }

  return (
    <Layout
      content={
        <Chart
          lines={chartLines}
          actualFirstIndex={signalOffset}
          minSelectionLength={50}
          maxSelectionLength={2500}
          initialSelectionLength={660}
          maxBottomValue={-1}
          minTopValue={1}
          detailsPopupWidth={180}
          detailsPopupValuePrecision={5}
        />
      }
      controls={<OptionsForm showDynamicsCompressor={useDynamicsCompressor} data={formData} onChange={setFormData} />}
    />
  )
})

export default SignalOptionsDemo

interface FormData {
  oscillator: OscillatorOptions
  dynamicsCompressor: DynamicsCompressorOptions
}

interface FormProps {
  showDynamicsCompressor?: boolean
  data: FormData
  onChange(data: FormData): unknown
}

const OptionsForm = React.memo(function OptionsForm({ showDynamicsCompressor, data, onChange }: FormProps) {
  return (
    <>
      {showDynamicsCompressor && <SectionHeader>Oscillator</SectionHeader>}
      <Form
        fields={[
          {
            label: 'Type:',
            input: (
              <Select
                options={oscillatorTypeOptions}
                selected={data.oscillator.type}
                onSelect={(type) => onChange({ ...data, oscillator: { ...data.oscillator, type } })}
              />
            ),
          },
          {
            label: 'Frequency:',
            value: `${data.oscillator.frequency}Hz`,
            input: (
              <Range
                value={data.oscillator.frequency}
                min={10}
                max={10000}
                step={10}
                isExponential
                onChange={(frequency) => onChange({ ...data, oscillator: { ...data.oscillator, frequency } })}
              />
            ),
          },
        ]}
      />
      {showDynamicsCompressor && <SectionHeader>Dynamics Compressor</SectionHeader>}
      {showDynamicsCompressor && (
        <Form
          fields={[
            {
              label: 'Threshold:',
              value: `${data.dynamicsCompressor.threshold}dB`,
              input: (
                <Range
                  value={data.dynamicsCompressor.threshold}
                  min={-100}
                  max={0}
                  step={1}
                  onChange={(threshold) =>
                    onChange({ ...data, dynamicsCompressor: { ...data.dynamicsCompressor, threshold } })
                  }
                />
              ),
            },
            {
              label: 'Knee:',
              value: `${data.dynamicsCompressor.knee}dB`,
              input: (
                <Range
                  value={data.dynamicsCompressor.knee}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(knee) => onChange({ ...data, dynamicsCompressor: { ...data.dynamicsCompressor, knee } })}
                />
              ),
            },
            {
              label: 'Ratio:',
              value: String(data.dynamicsCompressor.ratio),
              input: (
                <Range
                  value={data.dynamicsCompressor.ratio}
                  min={1}
                  max={20}
                  step={0.1}
                  isExponential
                  onChange={(ratio) => onChange({ ...data, dynamicsCompressor: { ...data.dynamicsCompressor, ratio } })}
                />
              ),
            },
            {
              label: 'Attack:',
              value: `${data.dynamicsCompressor.attack}s`,
              input: (
                <Range
                  value={data.dynamicsCompressor.attack + 0.001}
                  min={0.001}
                  max={1.001}
                  step={0.001}
                  isExponential
                  onChange={(attack) =>
                    onChange({
                      ...data,
                      dynamicsCompressor: { ...data.dynamicsCompressor, attack: removeFloatArtifact(attack - 0.001) },
                    })
                  }
                />
              ),
            },
            {
              label: 'Release:',
              value: `${data.dynamicsCompressor.release}s`,
              input: (
                <Range
                  value={data.dynamicsCompressor.release + 0.001}
                  min={0.001}
                  max={1.001}
                  step={0.001}
                  isExponential
                  onChange={(release) =>
                    onChange({
                      ...data,
                      dynamicsCompressor: {
                        ...data.dynamicsCompressor,
                        release: removeFloatArtifact(release - 0.001),
                      },
                    })
                  }
                />
              ),
            },
          ]}
        />
      )}
    </>
  )
})

const oscillatorTypeOptions = [
  {
    value: 'sawtooth',
    label: 'Sawtooth',
  },
  {
    value: 'sine',
    label: 'Sine',
  },
  {
    value: 'square',
    label: 'Square',
  },
  {
    value: 'triangle',
    label: 'Triangle',
  },
] as const
