import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';


@XoObjectClass(null, 'xmcp.factorymanager.filtermanager', 'StartParameterDetails')
export class XoStartParameterDetails extends XoObject {


    @XoProperty()
    lagacyParameterCombination: string[];


    @XoProperty()
    name: string;


    @XoProperty()
    documentation: string;


    @XoProperty()
    optional: boolean;


    @XoProperty()
    mandatory: string;


    @XoProperty()
    type: string;


}

@XoArrayClass(XoStartParameterDetails)
export class XoStartParameterDetailsArray extends XoArray<XoStartParameterDetails> {
}
