/**
 * confluence wiki 配置
 */
import { TocDetail } from './confluence/types'

export interface ConfluenceConfig {
  user: string
  password: string
  baseUrl: string
  spaceKey: string
  rootPageId: string
}

export interface DeployOptions {
  platform: 'default' | 'confluence'
  classify?: string
  postPath?: string
  /** 最后更新时间 */
  lastGenerate?: number
  mdNameFormat?: 'title' | 'urlname'
  adapter?: 'matter-markdown' | 'markdown' | 'html' | 'wiki'
  confluence?: ConfluenceConfig
}

export interface DocDetail {
  id: string
  doc_id: string
  properties: Properties
  body: string
  updated: number
  title: string
  toc?: TocDetail[]
  body_wiki?: string
}
interface Properties {
  urlname: string
  title: string
  date: string
  updated: string
  [key: string]: any
}
