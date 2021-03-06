const assert = require('assert')
const { convertPascalNaming } = require('./lib')
const { cssStyleProperties } = require('./css')
const {
  CType,
  CClass,
  CObject,
  CBinding,
  CNamespace,
  CFunction,
  CStruct,
  CBlock,
  CAssignmentExpression,
  CCallExpression,
  CMethod,
  CModule
} = require('../../trad')

class JSXExpressionContainer extends CCallExpression {
  constructor(id, method, ...args) {
    super(method, ...args)

    this.expressionId = id
  }
}

class CLCUIObjectValue extends CStruct {
  constructor() {
    super('ObjectValue')

    this.alias = 'ObjectValue'
    this.variablePrefix = 'val'
  }

  install() {
    this.addMember(new CObject('char', 'string', { isPointer: true }))
    this.addMember(new CObject('wchar_t', 'wstring', { isPointer: true }))
    this.addMember(new CObject('double', 'number'))
  }
}

class CLCUIObjectType extends CClass {
  constructor() {
    super('Object')

    this.alias = 'Object'
    this.variablePrefix = 'obj'
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

    this.addMember(new CObject(declarations.ObjectValue, 'value'))
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

class CLCUIStringBinding extends CBinding {
  create(value = typeof this.cThis.value !== 'undefined' ? this.cThis.value : null) {
    return new CCallExpression(this.cClass.getMember('String_New'), value)
  }

  init(value = typeof this.cThis.value !== 'undefined' ? this.cThis.value : null) {
    if (this.cThis.pointerLevel > 0) {
      return new CAssignmentExpression(this.cThis, this.create(value))
    }
    return new CCallExpression(this.cClass.getMember('String_Init'), this.cThis, value)
  }

  operate(operator, right) {
    // if right object is literal
    if (operator === '=' && !right.id) {
      return new CCallExpression(this.cClass.getMember('String_SetValue'), this.cThis, right.value)
    }
    return new CCallExpression(this.cClass.getMember('Object_Operate'), this.cThis, operator, right)
  }
}

class CLCUIString extends CLCUIObjectType {
  constructor() {
    super()

    this.alias = 'String'
    this.variablePrefix = 'str'
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

  bind(cThis) {
    return new CLCUIStringBinding(cThis, this)
  }
}

class CLCUINumberBinding extends CBinding {
  create(value = typeof this.cThis.value !== 'undefined' ? this.cThis.value : 0) {
    return new CCallExpression(this.cClass.getMember('Number_New'), value)
  }

  init(value = typeof this.cThis.value !== 'undefined' ? this.cThis.value : 0) {
    if (this.cThis.pointerLevel > 0) {
      return new CAssignmentExpression(this.cThis, this.create(value))
    }
    return new CCallExpression(this.cClass.getMember('Number_Init'), this.cThis, value)
  }

  operate(operator, right) {
    // if right object is literal
    if (operator === '=' && !right.id) {
      return new CCallExpression(this.cClass.getMember('Number_SetValue'), this.cThis, right.value)
    }
    return new CCallExpression(this.cClass.getMember('Object_Operate'), this.cThis, operator, right)
  }
}

class CLCUINumber extends CLCUIObjectType {
  constructor() {
    super()

    this.alias = 'Number'
    this.variablePrefix = 'num'
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

  bind(cThis) {
    return new CLCUINumberBinding(cThis, this)
  }
}

class CLCUIWidget extends CClass {
  constructor() {
    super('Widget')

    this.alias = 'Widget'
    this.variablePrefix = '$'
    this.namespace = LCUINamespace
    this.typedef.namespace = LCUINamespace
    this.typedefPointer.namespace = LCUINamespace
    this.useNamespaceForMethods = false
  }

  install() {
    this.addMember(new CLCUIObject('WidgetStyle', 'style'))
    this.addMember(new CLCUIObject('WidgetProperty', 'value'))
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

class CLCUIWidgetPropertyBinding extends CBinding {
  // FIXME: This implementation is not elegant enough, we need to redesign the C object binding workflow
  get(block) {
    const w = new CLCUIObject('Widget', 'w')
    const cstr = new CObject('const char', 'str', { isPointer: true })
    const funcName = `${this.cThis.parent.extra.widgetClassName}_GetProperty`
    const func = new CFunction(funcName, [w, cstr], declarations.Object.typedefPointer)
    const name = block.allocObjectName(`prop_${this.cThis.name}`)
    const prop = new CLCUIObject(null, name, { isAllocateFromStack: false })

    prop.isDeletable = true
    block.append([
      prop,
      new CAssignmentExpression(prop,
        new CCallExpression(func, this.cThis.parent, this.cThis.name))
    ])
    return prop
  }
}

class CLCUIWidgetProperty extends CLCUIObjectType {
  constructor() {
    super()

    this.alias = 'WidgetProperty'
    this.variablePrefix = 'prop'
  }

  bind(cThis) {
    return new CLCUIWidgetPropertyBinding(cThis, this)
  }
}

class CLCUIWidgetStylePropertyBinding extends CBinding {
  constructor(cThis, cClass) {
    super(cThis, cClass)

    const w = new CLCUIObject('Widget', 'w')
    const cstr = new CObject('const char', 'str', { isPointer: true })

    this.funcSetStyle = new CFunction('Widget_SetStyleString', [w, cstr, cstr])
  }

  operate(operator, right) {
    const widget = this.cThis.closest(isWidget)

    if (operator === '=') {
      assert(right.id, 'the right value must be a named variable')
      return new CCallExpression(this.funcSetStyle, widget,
        convertPascalNaming(this.cThis.name),
        right.selectProperty('value').selectProperty('string'))
    }
    return super.operate(this.cThis, operator, right)
  }
}

class CLCUIWidgetStyleProperty extends CLCUIString {
  constructor() {
    super('LCUI_Style')
    this.alias = 'WidgetStyleProperty'
  }

  bind(cThis) {
    return new CLCUIWidgetStylePropertyBinding(cThis, this)
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
  constructor(type, name, meta = {}) {
    let decl = type

    if (typeof type === 'string') {
      decl = declarations[type]
    } else if (!type) {
      decl = declarations.Object
    }
    assert(typeof decl !== 'undefined')
    if (decl instanceof CClass) {
      decl = meta.isAllocateFromStack ? decl.typedef : decl.typedefPointer
    }

    super(decl, name, meta)
    // class name in C
    this.cClassName = 'Object'
    this.extra.widgetClassName = null
  }
}

class ComputedProperty extends CLCUIObject {
  constructor(type, name) {
    super(type, name, { isAllocateFromStack: true })
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

    assert(cClass instanceof CClass)
    if (that) {
      that.node.remove()
    }
    this.widget.cClassName = cClass.className
    if (this.isStatic || this.methodName === 'delete') {
      return null
    }
    that = this.block.createObject(cClass.typedefPointer, '_this')

    const moduleClass = `${convertPascalNaming(cClass.className, '_')}_class`
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

// Rebuild base type to CLCUIObject
function toObject(obj) {
  if (typeof obj === 'string') {
    return new CLCUIObject('String', null, { isAllocateFromStack: true, value: obj })
  } else if (typeof obj === 'number') {
    return new CLCUIObject('Number', null, { isAllocateFromStack: true, value: obj })
  } else if (['String', 'Number'].indexOf(obj.type) >= 0) {
    return new CLCUIObject(obj.type, obj.id, { isAllocateFromStack: !obj.id, value: obj.value })
  }
  return obj
}

const LCUI = new CModule('lcui', 'lcui')
const LCUINamespace = new CNamespace('LCUI')
const declarations = {}
const types = [
  new CLCUIObjectValue(),
  new CLCUIObjectType(),
  new CLCUIString(),
  new CLCUINumber(),
  new CLCUIWidgetStyle(),
  new CLCUIWidgetStyleProperty(),
  new CLCUIWidgetPrototype(),
  new CLCUIWidgetEvent(),
  new CLCUIWidgetProperty(),
  new CLCUIWidget()
]

types.forEach(type => declarations[type.alias] = type)
types.slice().reverse().forEach(type => type.install ? type.install() : 0)
types.forEach(type => LCUI.append(type))
LCUI.append(LCUINamespace)

module.exports = {
  LCUI,
  toObject,
  isObject,
  isString,
  isNumber,
  isWidget,
  AppMethod: CLCUIAppMethod,
  WidgetMethod: CLCUIWidgetMethod,
  Object: CLCUIObject,
  ComputedProperty,
  JSXExpressionContainer
}
