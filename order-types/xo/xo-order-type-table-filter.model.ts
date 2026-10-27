// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';


@XoObjectClass(null, 'xmcp.factorymanager.ordertypes', 'OrderTypeTableFilter')
export class XoOrderTypeTableFilter extends XoObject {


    @XoProperty()
    showPath: boolean;


}

@XoArrayClass(XoOrderTypeTableFilter)
export class XoOrderTypeTableFilterArray extends XoArray<XoOrderTypeTableFilter> {
}
