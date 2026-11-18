import { describe, expect, it } from 'vitest'
import { localizacaoPublica, posicaoPublicaDado, posicaoPublicaEvento } from './privacidade.js'
import { distanciaMetros } from './geo.js'

describe('localizacaoPublica — RNF08 (~100 m)', () => {
  it('arredonda lat/lng para 3 casas decimais', () => {
    expect(localizacaoPublica({ lat: -23.541537, lng: -46.868042 })).toEqual({ lat: -23.542, lng: -46.868 })
  })

  it('o ponto público fica a no máximo ~76 m do real (meia célula da grade de ~100 m)', () => {
    // pior caso: o ponto real no meio da célula, nas duas direções
    const real = { lat: -23.5415, lng: -46.8685 }
    const publico = localizacaoPublica(real)
    const distancia = distanciaMetros(real, publico)
    expect(distancia).toBeGreaterThan(70)
    expect(distancia).toBeLessThanOrEqual(76)
  })

  it('registros vizinhos (a poucos metros) caem no mesmo ponto público', () => {
    const casaA = localizacaoPublica({ lat: -23.54121, lng: -46.86688 })
    const casaB = localizacaoPublica({ lat: -23.54139, lng: -46.86712 })
    expect(casaA).toEqual(casaB)
  })

  it('não altera o objeto original', () => {
    const real = { lat: -23.541537, lng: -46.868042 }
    localizacaoPublica(real)
    expect(real).toEqual({ lat: -23.541537, lng: -46.868042 })
  })
})

describe('posicaoPublicaEvento — posição no mapa público (Painel e Detalhe)', () => {
  const morador = { origem: 'Comunidade', lat: -23.541537, lng: -46.868042 }
  const sensor = { origem: 'Sensor', lat: -23.529, lng: -46.8622 }

  it('evento só da Comunidade → posição arredondada (~100 m)', () => {
    const evento = { lat: -23.541537, lng: -46.868042, dados: [morador] }
    expect(posicaoPublicaEvento(evento)).toEqual({ lat: -23.542, lng: -46.868 })
  })

  it('evento com dado de Sensor → posição do sensor, nunca a do morador', () => {
    const evento = { lat: morador.lat, lng: morador.lng, dados: [morador, sensor] }
    expect(posicaoPublicaEvento(evento)).toEqual({ lat: -23.529, lng: -46.8622 })
  })

  it('posicaoPublicaDado arredonda só registros da Comunidade', () => {
    expect(posicaoPublicaDado(morador)).toEqual({ lat: -23.542, lng: -46.868 })
    expect(posicaoPublicaDado(sensor)).toEqual({ lat: -23.529, lng: -46.8622 })
  })
})
