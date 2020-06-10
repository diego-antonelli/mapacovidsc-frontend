import {Component, OnInit} from '@angular/core';
import {AlertService} from 'ngx-alerts';
import {Router} from '@angular/router';
import {LoadingService} from '../../services/loading.service';
import * as L from 'leaflet';
import 'proj4leaflet/src/proj4leaflet';
import {RequestService} from '../../services/request.service';
import {environment} from '../../../environments/environment';
import {Preloader} from '../utils/preloader';
import {NgxSmartModalService} from 'ngx-smart-modal';
import {getCoresCasos, getCoresInternados, getCoresObitos, getCoresRecuperados} from '../utils/cores';
import {FormBuilder, FormGroup} from '@angular/forms';
import { Angular5Csv } from 'angular5-csv/dist/Angular5-csv';

@Component({
    selector: 'app-principal',
    templateUrl: './principal.component.html',
    styleUrls: ['./principal.component.scss']
})
export class PrincipalComponent implements OnInit {
    public resumo: DadosCovid;
    private escalas;
    classes = [];
    private camada = null;
    private camadaAnterior = null;
    filtroSelecionado = 'casos';

    private baseMap = L.tileLayer('https://api.mapbox.com/styles/v1/{styleUser}/{styleId}/tiles/256/{z}/{x}/{y}@2x?access_token={accessToken}', {
        maxZoom: 18,
        minZoom: 7,
        styleUser: environment.MAPBOX_STYLE_USER,
        styleId: environment.MAPBOX_STYLE_ID,
        accessToken: environment.MAPBOX_TOKEN,
        attribution: `&copy; <a href='https://www.mapbox.com/about/maps/'>Mapbox</a>
&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>
<strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong> | Dados do
<a href="http://dados.sc.gov.br/group/covid-19">Portal de Dados Abertos do Estado de Santa Catarina</a>
`
    });
    map: L.Map;
    options = {
        zoomControl: false,
        layers: [
            this.baseMap
        ],
        zoom: 7,
        center: L.latLng(-15.759933, -47.775688)
    };
    filterGroup: FormGroup;

    constructor(
        private fbBuilder: FormBuilder,
        private loadingService: LoadingService,
        private alertService: AlertService,
        private router: Router,
        private requestService: RequestService,
        private ngxSmartModalService: NgxSmartModalService
    ) {
        this.filterGroup = this.fbBuilder.group({
            'filtroSelecionado': 'casos'
        });
        this.filterGroup.controls.filtroSelecionado.valueChanges.subscribe(v => {
            this.filtroSelecionado = v;
            this.criarEscalas();
            this.atualizarMapa();
        });
    }

    ngOnInit() {
        this.loadingService.loading();
    }

    public onMapReady(map: L.Map) {
        this.map = map;
        L.control.zoom({
            position: 'topleft'
        }).addTo(this.map);
        const self = this;
        L.Control.QuestionButton = L.Control.extend({
            onAdd: function (m) {
                const container = L.DomUtil.create('input', 'leaflet-custom-control leaflet-help-control');
                container.type = 'button';
                container.value = '?';
                container.title = 'Sobre';
                container.alt = 'Sobre';
                container.onclick = function () {
                    self.ngxSmartModalService.getModal('about').open();
                };
                return container;
            },

            onRemove: function (m) {
                // Nothing to do here
            }
        });

        L.control.questionButton = function (opts) {
            return new L.Control.QuestionButton(opts);
        };
        L.control.questionButton({position: 'topleft'}).addTo(this.map);

        this.carregarCamadas();
    }

    private criarEscalas() {
        const {dados} = this.resumo;
        const numeros = {
            casos: dados.map(d => d.casos),
            casosAtivos: dados.map(d => d.casosAtivos),
            obitos: dados.map(d => d.obitos),
            recuperados: dados.map(d => d.recuperados),
            internados: dados.map(d => d.internados),
            internadosUti: dados.map(d => d.internadosUti)
        };
        const dadosConsolidados = {
            casos: {
                min: Math.min(...numeros.casos),
                max: Math.max(...numeros.casos),
            },
            casosAtivos: {
                min: Math.min(...numeros.casosAtivos),
                max: Math.max(...numeros.casosAtivos),
            },
            obitos: {
                min: Math.min(...numeros.obitos),
                max: Math.max(...numeros.obitos),
            },
            recuperados: {
                min: Math.min(...numeros.recuperados),
                max: Math.max(...numeros.recuperados),
            },
            internados: {
                min: Math.min(...numeros.internados),
                max: Math.max(...numeros.internados),
            },
            internadosUti: {
                min: Math.min(...numeros.internadosUti),
                max: Math.max(...numeros.internadosUti),
            }
        };
        this.escalas = Object.keys(dadosConsolidados).map(key => ({
            [key]: {
                min: dadosConsolidados[key].min,
                max: dadosConsolidados[key].max,
                passo: Math.round((dadosConsolidados[key].max - dadosConsolidados[key].min) / 5)
            }
        })).reduce((o, c) => ({...o, ...c}), {});

        this.classes = [];
        const passo = this.escalas[this.filtroSelecionado].passo;
        [1, 2, 3, 4, 5].map((camada, index, array) => {
            let legenda = `${(array[index - 1] * passo) + 1} a ${camada * passo}`;
            if (camada === 1) {
                legenda = `1 a ${passo}`;
            }
            this.classes.push({
                cor: this.getCorCamada(camada),
                legenda
            });
        });
    }

    private carregarDados() {
        this.requestService.get(`${environment.API_URL}/resultados`)
            .subscribe((response: any) => {
                this.resumo = response;
                this.resumo.dados.sort((a, b) => a.nome.localeCompare(b.nome));
                this.resumo.casosAtivos = this.resumo.casos - (this.resumo.recuperados + this.resumo.obitos);
                this.resumo.dados = this.resumo.dados.map(dado => ({
                    ...dado,
                    casosAtivos: dado.casos - (dado.recuperados + dado.obitos)
                }));
                if (response && response.dados.length > 0) {
                    this.criarEscalas();
                    this.atualizarMapa();
                }
                this.loadingService.stopLoading();
            }, err => {
                this.loadingService.stopLoading();
                this.alertService.danger('Ocorreu um erro ao carregar os dados');
            });
    }

    private carregarCamadas() {
        if (Preloader.checkLayer('SC')) {
            this.camada = Preloader.getLayer('SC');
            this.carregarDados();
        } else {
            this.requestService.get(`/assets/json/SC.json`)
                .subscribe(camada => {
                    this.camada = camada;
                    Preloader.addLayer('SC', camada);
                    this.carregarDados();
                });
        }
    }

    private getCor(dado) {
        const escala = this.escalas[this.filtroSelecionado];
        const valor = dado[this.filtroSelecionado];
        const camada = Math.ceil(valor / escala.passo);
        return this.getCorCamada(camada);
    }

    private getCorCamada(camada: number) {
        switch (this.filtroSelecionado) {
            case 'casos':
            case 'casosAtivos':
                return getCoresCasos(camada);
            case 'obitos':
                return getCoresObitos(camada);
            case 'recuperados':
                return getCoresRecuperados(camada);
            case 'internados':
            case 'internadosUti':
                return getCoresInternados(camada);
        }
    }

    private atualizarMapa(): void {
        const resumo = this.resumo;
        if (this.camadaAnterior) {
            this.map.removeLayer(this.camadaAnterior);
        }
        if (this.camada) {
            const municipiosFiltrados = resumo.dados.filter(d => d[this.filtroSelecionado] > 0).map(d => d.codigoIbge);
            const camadaProjetada = L.Proj.geoJson(this.camada, {
                style: (feature) => {
                    if (municipiosFiltrados.includes(Number(feature.properties.CD_GEOCODM))) {
                        const dado = this.resumo.dados.filter(m => m.codigoIbge === Number(feature.properties.CD_GEOCODM))[0];
                        return {
                            'color': dado ? this.getCor(dado) : '#FFF',
                            'weight': 1,
                            'opacity': 1,
                            'fillOpacity': 0.9
                        };
                    }
                    return {
                        color: '#FFF',
                        fillOpacity: 0.4,
                        weight: 0,
                        opacity: 0
                    };
                }
            })
                .bindPopup(function (layer) {
                    let dado: DadosMunicipio = resumo.dados.filter(m => m.codigoIbge === Number(layer.feature.properties.CD_GEOCODM))[0];
                    if (!dado) {
                        dado = {
                            internados: 0,
                            internadosUti: 0,
                            recuperados: 0,
                            obitos: 0,
                            casos: 0,
                            casosAtivos: 0,
                            nome: layer.feature.properties.NM_MUNICIP,
                            codigoIbge: layer.feature.properties.CD_GEOCODM,
                            dados: []
                        };
                    }
                    const idades = {
                        internados: dado.dados.filter(d => d.internado).map(d => d.idade),
                        internadosUti: dado.dados.filter(d => d.internadoUti).map(d => d.idade),
                        recuperados: dado.dados.filter(d => d.recuperado).map(d => d.idade),
                        obitos: dado.dados.filter(d => d.obito).map(d => d.idade),
                        casos: dado.dados.map(d => d.idade),
                        casosAtivos: dado.dados.filter(d => !d.recuperado && !d.obito).map(d => d.idade),
                    };
                    return `<h2>${dado.nome}</h2>
                            <ul>
                               <li>Infectados: <strong>${dado.casos}</strong> ${getIdades('casos', idades)}</li>
                               <li>Casos ativos: <strong>${dado.casosAtivos}</strong> ${getIdades('casosAtivos', idades)}</li>
                               <li>Recuperados: <strong>${dado.recuperados}</strong> ${getIdades('recuperados', idades)}</li>
                               <li>Internados: <strong>${dado.internados}</strong> ${getIdades('internados', idades)}</li>
                               <li>Internados UTI: <strong>${dado.internadosUti}</strong> ${getIdades('internadosUti', idades)}</li>
                               <li>Óbitos: <strong>${dado.obitos}</strong> ${getIdades('obitos', idades)}</li>
                            </ul>`;
                })
                .addTo(this.map);
            this.camadaAnterior = camadaProjetada;
            this.map.fitBounds(camadaProjetada.getBounds());
        }
    }

    public exportarDados() {
        const data = this.resumo.dados.flatMap(d => d.dados);
        const prunedData = data.map(dados => {
            Object.keys(dados).forEach(key => {
                switch (typeof dados[key]) {
                    case 'boolean':
                        if (!!dados[key]) {
                            dados[key] = 'SIM';
                        } else {
                            dados[key] = 'NÃO';
                        }
                        break;
                    case 'string':
                        if (dados[key] === 'NULL') {
                            dados[key] = '';
                        }
                        if (dados[key] && isDate(dados[key])) {
                            dados[key] = new Date(dados[key]).toLocaleDateString();
                        }
                        break;
                }
            });
            delete dados.publicacao;
            delete dados.codigoIbge;
            delete dados.latitude;
            delete dados.longitude;
            return dados;
        });
        // tslint:disable-next-line:no-unused-expression
        new Angular5Csv(prunedData, 'Dados COVID SC', {
            fieldSeparator: ';',
            decimalseparator: '.',
            headers: ['Recuperado', 'Início sintomas',
                'Data Coleta', 'Sintomas', 'Comorbidades', 'Internado',
                'Internado UTI', 'Sexo', 'Município', 'Óbito', 'Data óbito',
                'Idade', 'Data resultado', 'Critério de confirmação',
            'Tipo de teste', 'Município de confirmação', 'Sus', 'Sivep', 'Lacen',
                'Laboratório privado', 'Nome do laboratório', 'Teste rápido',
            'PCR', 'Data de internação', 'Data de entrada na UTI', 'Regional de saúde',
            'Data de evolução do caso', 'Data de saída da UTI', 'Bairro'],
            nullToEmptyString: true,
        });
    }
}

function isDate(_date){
    const _regExp  = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
    return _regExp.test(_date);
}

function getIdades(key: string, idades: any) {
    if (idades[key] && idades[key].length > 0) {
        return `<i>(entre ${Math.min(...idades[key])} e ${Math.max(...idades[key])} anos)</i>`;
    }
    return '';
}

interface DadosCovid {
    publicacao: Date;
    internados: number;
    internadosUti: number;
    recuperados: number;
    obitos: number;
    casos: number;
    casosAtivos: number;
    dados: DadosMunicipio[];
}

interface DadosMunicipio {
    nome: string;
    codigoIbge: number;
    internados: number;
    internadosUti: number;
    recuperados: number;
    obitos: number;
    casos: number;
    casosAtivos: number;
    dados: any[];
}
