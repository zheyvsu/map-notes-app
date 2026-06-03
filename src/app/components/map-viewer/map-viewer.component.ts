import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import * as echarts from 'echarts';

/**
 * 地图查看器组件
 * 使用 ECharts 渲染中国地图（支持下钻到区县）
 */
@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [],
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.scss'
})
export class MapViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLElement>;

  private chart: any;
  private currentMap = 'china';
  private adcode = '100000'; // 中国

  constructor() {}

  ngAfterViewInit(): void {
    this.initChart();
  }

  /**
   * 初始化 ECharts 地图
   */
  private initChart(): void {
    const chartDom = this.mapContainer.nativeElement;
    this.chart = echarts.init(chartDom);

    // 加载并注册中国地图
    this.loadMap('100000', 'china');
  }

  /**
   * 加载地图数据
   */
  private loadMap(adcode: string, mapName: string): void {
    this.adcode = adcode;
    this.currentMap = mapName;

    fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`)
      .then(response => response.json())
      .then(data => {
        echarts.registerMap(mapName, data);

        const option = {
          geo: {
            map: mapName,
            roam: true,
            label: {
              show: true,
              fontSize: 10,
              color: '#333'
            },
            itemStyle: {
              areaColor: '#f3f4f6',
              borderColor: '#999'
            },
            emphasis: {
              itemStyle: {
                areaColor: '#e8f4f8'
              },
              label: {
                show: true,
                color: '#2196F3'
              }
            }
          },
          backgroundColor: '#f0f0f0'
        };

        this.chart.setOption(option, true);

        // 设置点击事件，下钻到区县
        this.chart.off('click');
        this.chart.on('click', (params: any) => {

          if (params.name && adcode === '100000') {
            // 中国地图，点击省份下钻
            const provinceAdcode = this.getProvinceAdcode(params.name);

            if (provinceAdcode) {
              this.loadMap(provinceAdcode, params.name);
            }
          } else {
            // 区县地图，点击返回中国地图
            this.loadMap('100000', 'china');
          }
        });
      })
      .catch(error => {
        console.error('加载地图数据失败:', error);
      });
  }

  /**
   * 获取省份 adcode
   */
  private getProvinceAdcode(provinceName: string): string | null {
    const provinceMap: { [key: string]: string } = {
      '北京': '110000',
      '天津': '120000',
      '上海': '310000',
      '重庆': '500000',
      '河北': '130000',
      '山西': '140000',
      '内蒙古': '150000',
      '辽宁': '210000',
      '吉林': '220000',
      '黑龙江': '230000',
      '江苏': '320000',
      '浙江': '330000',
      '安徽': '340000',
      '福建': '350000',
      '江西': '360000',
      '山东': '370000',
      '河南': '410000',
      '湖北': '420000',
      '湖南': '430000',
      '广东': '440000',
      '广西': '450000',
      '海南': '460000',
      '四川': '510000',
      '贵州': '520000',
      '云南': '530000',
      '西藏': '540000',
      '陕西': '610000',
      '甘肃': '620000',
      '青海': '630000',
      '宁夏': '640000',
      '新疆': '650000',
      '台湾': '710000',
      '香港': '810000',
      '澳门': '820000',
      // 别名/简称
      '黑龙江省': '230000',
      '内蒙古自治区': '150000',
      '广西壮族自治区': '450000',
      '西藏自治区': '540000',
      '宁夏回族自治区': '640000',
      '新疆维吾尔自治区': '650000',
      '香港特别行政区': '810000',
      '澳门特别行政区': '820000'
    };
    return provinceMap[provinceName] || null;
  }

  /**
   * 窗口大小变化时重新渲染图表
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.chart) {
      this.chart.resize();
    }
  }

  /**
   * 禁用右键菜单
   */
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  /**
   * 组件销毁时释放资源
   */
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
