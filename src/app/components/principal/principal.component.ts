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
import {getCoresCasos, getCoresInternados, getCoresInternadosUTI, getCoresObitos, getCoresRecuperados} from '../utils/cores';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
    selector: 'app-principal',
    templateUrl: './principal.component.html',
    styleUrls: ['./principal.component.scss']
})
export class PrincipalComponent implements OnInit {
    public resumo: DadosCovid;
    private escalas;
    private classes = [];
    private camada = null;
    private camadaAnterior = null;
    filtroSelecionado = 'casos';

    private baseMap = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        maxZoom: 18,
        minZoom: 7,
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1IjoiZGllZ29hbnRvbmVsbGkiLCJhIjoiY2o3NThsd3NmMGkwYTMzbngydHY4NWhobiJ9.kt5xyF3LCmCCLF38Ak49lw',
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
            let legenda = `${(array[index - 1] * passo)+1} a ${camada * passo}`;
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
                return getCoresCasos(camada);
            case 'obitos':
                return getCoresObitos(camada);
            case 'recuperados':
                return getCoresRecuperados(camada);
            case 'internados':
                return getCoresInternados(camada);
            case 'internadosUti':
                return getCoresInternadosUTI(camada);
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
                filter: (feature) => {
                    return municipiosFiltrados.includes(Number(feature.properties.CD_GEOCODM));
                },
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
                        color: '#EAEAEA',
                        fillOpacity: 0.5,
                        weight: 1,
                        opacity: 1
                    };
                }
            })
                .bindPopup(function (layer) {
                    const dado = resumo.dados.filter(m => m.codigoIbge === Number(layer.feature.properties.CD_GEOCODM))[0];
                    return `<h2>${dado.nome}</h2>
                            <ul>
                               <li>Infectados: <strong>${dado.casos}</strong></li>
                               <li>Recuperados: <strong>${dado.recuperados}</strong></li>
                               <li>Internados: <strong>${dado.internados}</strong></li>
                               <li>Internados UTI: <strong>${dado.internadosUti}</strong></li>
                               <li>Óbitos: <strong>${dado.obitos}</strong></li>
                            </ul>`;
                })
                .addTo(this.map);
            this.camadaAnterior = camadaProjetada;
            this.map.fitBounds(camadaProjetada.getBounds());
        }
    }
}

interface DadosCovid {
    publicacao: Date;
    internados: number;
    internadosUti: number;
    recuperados: number;
    obitos: number;
    casos: number;
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
    dados: any[];
}
