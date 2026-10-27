// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'DeleteDuplicatesResponse')
export class XoDeleteDuplicatesResponse extends XoObject {


    @XoProperty()
    problematicFQNs: string[];


}

@XoArrayClass(XoDeleteDuplicatesResponse)
export class XoDeleteDuplicatesResponseArray extends XoArray<XoDeleteDuplicatesResponse> {
}
