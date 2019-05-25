const assert = require('assert')
const { toIdentifierName } = require('./lib')
const { cssStyleProperties } = require('./css')
const {
  CType,
  CClass,
  CObject,
  CNamespace,
  CFunction,
  CTypedef,
  CAssignmentExpression,
  CCallExpression,
  CMethod,
  CModule
} = require('../../trad')

class CLCUIObjectType extends CClass {
  constructor() {
    super('Object')

    this.alias = 'Object'
    this.namespace = LCUINamespace
    this.typedef.namespace = LCUINamespace
    this.typedefPointer.namespace = LCUINamespace
    this.useNamespaceForMethods = false
  }

  install() {
    const obj = new CLCUIObject(null, 'obj')
    const cstrConst = new CObject('const char', 'str', { isPointer: true })
    const cstrObj = new CLCUIObject('String', 'str')
    const cfunc = new CObject('void', 'func', { isPointer: true })
    const cptr = new CObject('void', 'ptr', { isPointer: true })

    this.addMember(new CObject('int', 'value'))
    this.addMethod(new CMethod('init'))
    this.addMethod(new CMethod('destroy'))
    this.addMethod(new CMethod('new', [], obj.typeDeclaration))
    this.addMethod(new CMethod('delete'))
    this.addMethod(new CMethod('operate', [cstrConst, obj], obj.typeDeclaration))
    this.addMethod(new CMethod('compare', [obj], 'int'))
    this.addMethod(new CMethod('duplicate', [], obj.typeDeclaration))
    this.addMethod(new CMethod('toString', [], cstrObj.typeDeclaration))
    this.addMethod(new CMethod('watch', [cfunc, cptr]))
    this.addMethod(new CMethod('notify'))
  }
}

class CLCUIString extends CLCUIObjectType {
  constructor() {
    super()

    this.alias = 'String'
  }

  install() {
    const obj = new CLCUIObject('String', 'obj')
    const cstrConst = new CObject('const char', 'str', { isPointer: true })

    super.install()
    this.addMember(new CFunction('String_New', [cstrConst], obj.typeDeclaration))
    this.addMember(new CFunction('String_Init', [obj, cstrConst]))
    this.addMember(new CFunction('String_SetValue', [obj, cstrConst]))
    this.addMember(new CFunction('Object_Operate', [obj, cstrConst, obj], obj.typeDeclaration))
  }

  init(obj, value = null) {
    if (obj.pointerLevel > 0) {
      return new CAssignmentExpression(obj, new CCallExpression(this.getMember('String_New'), value))
    }
    return new CCallExpression(this.getMember('String_Init'), obj, value)
  }

  operate(left, operator, right) {
    // if right object is literal
    if (operator === '=' && !right.id) {
      return new CCallExpression(this.getMember('String_SetValue'), left, right.value)
    }
    return new CCallExpression(this.getMember('Object_Operate'), left, operator, right)
  }
}

class CLCUINumber extends CLCUIObjectType {
  constructor() {
    super()

    this.alias = 'Number'
  }

  install() {
    const obj = new CLCUIObject('Number', 'obj')
    const cnum = new CObject('double', 'num')
    const cstrConst = new CObject('const char', 'str', { isPointer: true })

    super.install()
    this.addMember(new CFunction('Number_New', [cnum], obj.typeDeclaration))
    this.addMember(new CFunction('Number_Init', [obj, cnum]))
    this.addMember(new CFunction('Number_SetValue', [obj, cnum]))
    this.addMember(new CFunction('Object_Operate', [obj, cstrConst, obj], obj.typeDeclaration))
  }

  init(obj, value = 0) {
    if (obj.pointerLevel > 0) {
      return new CAssignmentExpression(obj, new CCallExpression(this.getMember('Number_New'), value))
    }
    return new CCallExpression(this.getMember('Number_Init'), obj, value)
  }

  operate(left, operator, right) {
    // if right object is literal
    if (operator === '=' && !right.id) {
      return new CCallExpression(this.getMember('Number_SetValue'), left, right.value)
    }
    return new CCallExpression(this.getMember('Object_Operate'), left, operator, right)
  }
}

class CLCUIWidget extends CClass {
  constructor() {
    super('Widget')

    this.alias = 'Widget'
    this.namespace = LCUINamespace
    this.typedef.namespace = LCUINamespace
    this.typedefPointer.namespace = LCUINamespace
    this.useNamespaceForMethods = false
  }

  install() {
    this.addMember(new CLCUIObject('WidgetStyle', 'style'))
  }
}

class CLCUIWidgetEvent extends CType {
  constructor() {
    super('LCUI_WidgetEvent')

    this.isPointer = true
    this.alias = 'WidgetEvent'
  }
}

class CLCUIWidgetPrototype extends CType {
  constructor() {
    super('LCUI_WidgetPrototype')

    this.isPointer = true
    this.alias = 'WidgetPrototype'
  }
}

class CLCUIWidgetStyleProperty extends CLCUIString {
  constructor() {
    super('LCUI_Style')
    this.alias = 'WidgetStyleProperty'
    this.funcSetStyle = null
  }

  install() {
    const w = new CLCUIObject('Widget', 'w')
    const cnum = new CObject('int', 'num')
    const cstr = new CObject('const char', 'str', { isPointer: true })

    this.funcSetStyle = new CFunction('Widget_SetStyleString', [w, cnum, cstr])
  }

  operate(obj, operator, right) {
    const widget = obj.closest(isWidget)

    if (operator === '=') {
      const value = right.selectProperty('value')
      const key = new CObject('Number', `key_${toIdentifierName(obj.name)}`)
      const cstr = new CObject('const char', `${value.id}.string`, { isPointer: true })
      return new CCallExpression(this.funcSetStyle, widget, key, cstr)
    }
    return super.operate(obj, operator, right)
  }
}

class CLCUIWidgetStyle extends CClass {
  constructor() {
    super('LCUI_WidgetStyle')
    this.alias = 'WidgetStyle'
  }

  install() {
    cssStyleProperties.forEach(name => this.addMember(new CLCUIObject('WidgetStyleProperty', name)))
  }
}

class CLCUIObject extends CObject {
  constructor(type, name, { isPointer = false, isAllocFromStack = false } = {}) {
    let decl = type

    if (typeof type === 'string') {
      decl = declarations[type]
      assert(typeof type !== 'undefined')
    } else if (!type) {
      decl = declarations.Object
    }
    if (decl instanceof CClass) {
      decl = isAllocFromStack ? decl.typedef : decl.typedefPointer
    }
    super(decl, name, { isPointer })

    // class name in C
    this.cClassName = 'Object'
  }
}

class CLCUIWidgetMethod extends CMethod {
  constructor(name, args = [], returnType = '') {
    super(name, args, returnType)

    this.widget = new CLCUIObject('Widget', 'w')
  }

  get funcArgs() {
    if (this.isStatic) {
      return this.meta.funcArgs
    }
    return [this.widget].concat(this.meta.funcArgs)
  }

  set funcArgs(args) {
    this.meta.funcArgs = args
  }

  bind(cClass) {
    let that = this.block.getThis()
    let ctype = cClass.name

    if (that) {
      that.node.remove()
    }
    this.widget.cClassName = cClass.className
    if (this.isStatic || this.methodName === 'delete') {
      return null
    }
    if (cClass instanceof CTypedef) {
      ctype = cClass.reference.cName
      that = this.block.createObject(cClass, '_this')
    } else {
      that = this.block.createObject(cClass.typedefPointer, '_this')
    }

    const moduleClass = `${toIdentifierName(cClass.className)}_class`
    const proto = new CObject('void', `${moduleClass}.proto`, { isPointer: true })
    const size = new CObject('size_t', `sizeof(${ctype})`)
    const funcAddData = new CFunction('Widget_AddData', [this.widget, proto, size], cClass.typedefPointer)
    const funcGetData = new CFunction('Widget_GetData', [this.widget, proto], cClass.typedefPointer)

    if (this.methodName === 'constructor') {
      this.block.append(new CAssignmentExpression(that, new CCallExpression(funcAddData, this.widget, proto, size)))
    } else {
      this.block.append(new CAssignmentExpression(that, new CCallExpression(funcGetData, this.widget, proto)))
    }
    return that
  }
}

class CLCUIAppMethod extends CMethod {
  constructor(name, args = [], returnType = '') {
    super(name, args, returnType)

    this.widget = null
  }

  bind(cClass) {
    super.bind(cClass)

    this.widget = this.block.getThis().selectProperty('widget')
  }
}

function isString(obj) {
  return obj.finalTypeDeclaration === declarations.String
}

function isNumber(obj) {
  return obj.finalTypeDeclaration === declarations.Number
}

function isObject(obj) {
  return obj.finalTypeDeclaration instanceof CLCUIObjectType
}

function isWidget(obj) {
  return obj.finalTypeDeclaration instanceof CLCUIWidget
}

const LCUI = new CModule('lcui', 'lcui')
const LCUINamespace = new CNamespace('LCUI')
const declarations = {}
const types = [
  new CLCUIObjectType(),
  new CLCUIString(),
  new CLCUINumber(),
  new CLCUIWidgetStyle(),
  new CLCUIWidgetStyleProperty(),
  new CLCUIWidgetPrototype(),
  new CLCUIWidgetEvent(),
  new CLCUIWidget()
]

types.forEach(type => declarations[type.alias] = type)
types.slice().reverse().forEach(type => type.install ? type.install() : 0)
types.forEach(type => LCUI.append(type))
LCUI.append(LCUINamespace)

module.exports = {
  LCUI,
  isObject,
  isString,
  isNumber,
  isWidget,
  AppMethod: CLCUIAppMethod,
  WidgetMethod: CLCUIWidgetMethod,
  Object: CLCUIObject
}
