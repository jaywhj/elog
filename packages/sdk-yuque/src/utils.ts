import frontMatter from 'front-matter'
import moment from 'moment'
import unified from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import remarkFrontMatter from 'remark-frontmatter'
import { DocUnite, YuqueDocProperties } from './types'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
/**
 * 生成元数据
 */
export const getProps = (page: DocUnite) => {
  let { body } = page
  try {
    // front matter信息的<br/>换成 \n
    const regex = /^---[\s|\S]+?---/i
    body = body.replace(regex, (a) => a.replace(/(<br \/>|<br>|<br\/>)/gi, '\n'))
    const result = frontMatter(body)
    // 删除frontMatter
    body = body.replace(regex, '')
    let properties = result.attributes as YuqueDocProperties
    // 注入title 和urlname
    properties.title = page.title
    // urlname
    properties.urlname = page.slug
    // 作者
    properties.author = page.book.user.name
    // 创建时间
    properties.date = formatDate(page.created_at)
    // 更新时间
    properties.updated = formatDate(page.updated_at)
    return {
      body,
      properties,
    }
  } catch (e) {
    return {
      body,
      properties: {},
    }
  }
}

/**
 * 格式化日期
 * @param date
 */
export function formatDate(date: Date) {
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 处理表格中的特殊字符
 * @param tree
 */
const processTable = (tree: any) => {
  // 找到type为table的节点
  for (const node of tree.children) {
    if (node.type == 'table') {
      // 找到tableCell子节点
      for (const tableRow of node.children) {
        for (const tableCell of tableRow.children) {
          // 删除节点
          tableCell.children = tableCell.children.filter((raw: any) => {
            // 判断是不是br
            const isBr = raw.type === 'html' && raw.value === '<br />'
            // 是的话删除这个节点
            return !isBr
          })
        }
      }
    }
  }
}

/**
 * 处理markdown
 * @param content
 */
export const processMarkdown = (content: string) => {
  const processValue = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontMatter, ['yaml'])
    .use(() => (tree) => {
      processTable(tree)
    })
    .use(remarkStringify)
    // 开始同步执行解析
    .processSync(content)
  return processValue.contents as string
}

/**
 * 处理语雀字符串
 */
export function processMarkdownRaw(raw: string) {
  // 处理不可见字符
  const nul = /\x00/g
  const nul1 = /\u0000/g
  const emptyAnchor = /<a name=\".*?\"><\/a>/g
  const hiddenContent = /<div style="display:none">[\s\S]*?<\/div>/gi
  raw = raw.replace(nul, '').replace(nul1, '').replace(hiddenContent, '').replace(emptyAnchor, '')
  // 处理markdown
  raw = processMarkdown(raw)
  const multiBr = /(<br>[\s\n]){2}/gi
  const multiBrEnd = /(<br \/>[\n]?){2}/gi
  const brBug = /<br \/>/g
  // 删除语雀特有的锚点
  raw = raw.replace(multiBr, '<br>').replace(multiBrEnd, '<br />\n').replace(brBug, '\n')
  return raw
}

/**
 * 语雀css文件
 */
const cssStyle = [
  {
    type: 'element',
    tagName: 'link',
    properties: {
      rel: ['stylesheet'],
      href: 'http://editor.yuque.com/ne-editor/lake-content-v1.css',
    },
    children: [],
  },
  {
    type: 'text',
    value: '\n    ',
  },
]

const findHead = (node: any) => {
  // 如果当前节点是一个 element，而且它的 tagName 是 "head"，那么就返回它
  if (node.type === 'element' && node.tagName === 'head') {
    node.children.push(...cssStyle)
  }
  // 否则，继续递归遍历它的 children 数组
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      findHead(child)
    }
  }
}

/**
 * 处理Html
 * @param content
 */
const processHtml = (content: string) => {
  const processValue = unified()
    .use(rehypeParse)
    .use(() => (tree) => {
      // processTable(tree)
      findHead(tree)
    })
    .use(rehypeStringify)
    // 开始同步执行解析
    .processSync(content)
  return processValue.contents as string
}

/**
 * 处理语雀的HTML
 * @param html
 */
export const processHtmlRaw = (html: string) => {
  // 给语雀的HTML头部加上css文件
  return processHtml(html)
}
